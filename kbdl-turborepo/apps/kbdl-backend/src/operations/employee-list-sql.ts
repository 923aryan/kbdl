/** Raw SQL helpers for employer employee listing + faceted counts. */



export type EmployeeRosterFilter = 'active' | 'past' | 'all';



export type EmployeeListFilters = {

  companyId: string;

  roster?: EmployeeRosterFilter;

  search?: string;

  designations?: string[];

  departments?: string[];

  statuses?: string[];

  genders?: string[];

  employeeTypes?: string[];

};



export type FacetDimension =

  | 'designation'

  | 'department'

  | 'status'

  | 'gender'

  | 'employee_type';



/** Mirrors `employment-status-map.ts` — keep in sync when UI status rules change. */

export const UI_STATUS_SQL = `

CASE

  WHEN ee.is_active = false THEN 'Inactive'

  ELSE

    CASE COALESCE(hp.onboarding_stage::text, 'onboard')

      WHEN 'draft' THEN 'On Boarding'

      WHEN 'probation' THEN 'Probation'

      ELSE 'Onboard'

    END

END`;



export const BASE_FROM_SQL = `

FROM employee_employments ee

INNER JOIN workforce_persons wp ON wp.id = ee.workforce_person_id

LEFT JOIN users u ON u.id = wp.linked_user_id

LEFT JOIN employee_hr_profiles hp ON hp.employment_id = ee.id

LEFT JOIN company_designations cd ON cd.id = hp.designation_id AND cd.company_id = ee.company_id

LEFT JOIN departments d ON d.id = hp.department_id AND d.company_id = ee.company_id

LEFT JOIN company_members cm ON cm.employment_id = ee.id`;



type BuiltWhere = {

  sql: string;

  params: unknown[];

  nextIndex: number;

};



function pushParam(params: unknown[], value: unknown, nextIndex: number): string {

  params.push(value);

  return `$${nextIndex}`;

}



export function buildWhereClause(

  filters: EmployeeListFilters,

  exclude?: FacetDimension,

): BuiltWhere {

  const params: unknown[] = [filters.companyId];

  let nextIndex = 2;

  const conditions: string[] = ['ee.company_id = $1::uuid'];



  const roster = filters.roster ?? 'active';

  if (roster === 'active') {

    conditions.push(`ee.is_active = true`);

  } else if (roster === 'past') {

    conditions.push(`ee.is_active = false`);

  }



  if (filters.search?.trim()) {

    const p = pushParam(params, `%${filters.search.trim()}%`, nextIndex);

    nextIndex += 1;

    conditions.push(`(

      COALESCE(hp.full_name, u.name, '') ILIKE ${p}

      OR wp.phone_no ILIKE ${p}

      OR COALESCE(ee.employee_no, '') ILIKE ${p}

      OR COALESCE(wp.karigari_id, '') ILIKE ${p}

    )`);

  }



  if (exclude !== 'designation' && filters.designations?.length) {

    const p = pushParam(params, filters.designations, nextIndex);

    nextIndex += 1;

    conditions.push(`COALESCE(cd.name, 'Unassigned') = ANY(${p}::text[])`);

  }



  if (exclude !== 'department' && filters.departments?.length) {

    const p = pushParam(params, filters.departments, nextIndex);

    nextIndex += 1;

    conditions.push(`COALESCE(d.name, 'Unassigned') = ANY(${p}::text[])`);

  }



  if (exclude !== 'status' && filters.statuses?.length) {

    const p = pushParam(params, filters.statuses, nextIndex);

    nextIndex += 1;

    conditions.push(`(${UI_STATUS_SQL}) = ANY(${p}::text[])`);

  }



  if (exclude !== 'gender' && filters.genders?.length) {

    const p = pushParam(params, filters.genders, nextIndex);

    nextIndex += 1;

    conditions.push(`COALESCE(hp.gender, 'unknown') = ANY(${p}::text[])`);

  }



  if (exclude !== 'employee_type' && filters.employeeTypes?.length) {

    const p = pushParam(params, filters.employeeTypes, nextIndex);

    nextIndex += 1;

    conditions.push(`COALESCE(hp.employee_type, 'Unassigned') = ANY(${p}::text[])`);

  }



  return {

    sql: conditions.join(' AND '),

    params,

    nextIndex,

  };

}



const FACET_KEY_SQL: Record<FacetDimension, string> = {

  designation: `COALESCE(cd.name, 'Unassigned')`,

  department: `COALESCE(d.name, 'Unassigned')`,

  status: UI_STATUS_SQL,

  gender: `COALESCE(hp.gender, 'unknown')`,

  employee_type: `COALESCE(hp.employee_type, 'Unassigned')`,

};



export function buildFacetQuery(filters: EmployeeListFilters, dimension: FacetDimension) {

  const where = buildWhereClause(filters, dimension);

  const keySql = FACET_KEY_SQL[dimension];



  const sql = `

    SELECT ${keySql} AS facet_key, COUNT(*)::int AS count

    ${BASE_FROM_SQL}

    WHERE ${where.sql}

    GROUP BY 1

    ORDER BY 1 ASC

  `;



  return { sql, params: where.params };

}



export function buildTotalQuery(filters: EmployeeListFilters) {

  const where = buildWhereClause(filters);

  const sql = `

    SELECT COUNT(*)::int AS count

    ${BASE_FROM_SQL}

    WHERE ${where.sql}

  `;

  return { sql, params: where.params };

}



const SORT_COLUMNS: Record<string, string> = {

  name: 'COALESCE(hp.full_name, u.name)',

  joined_at: 'ee.joined_at',

  designation: 'COALESCE(cd.name, \'Unassigned\')',

  status: UI_STATUS_SQL,

  rating: 'u.rating_avg',

};



export function buildListQuery(

  filters: EmployeeListFilters,

  options: {

    sort: string;

    sortDir: 'asc' | 'desc';

    limit: number;

    offset: number;

  },

) {

  const where = buildWhereClause(filters);

  const sortColumn = SORT_COLUMNS[options.sort] ?? SORT_COLUMNS.joined_at!;

  const direction = options.sortDir === 'asc' ? 'ASC' : 'DESC';

  const nulls = options.sort === 'rating' ? ' NULLS LAST' : '';



  const limitParam = pushParam(where.params, options.limit, where.nextIndex);

  const offsetParam = pushParam(where.params, options.offset, where.nextIndex + 1);



  const sql = `

    SELECT

      ee.id AS employment_id,

      ee.employee_no,

      ee.is_active,

      ee.separation_reason,

      ee.joined_at,

      ee.left_at,

      wp.id AS workforce_person_id,

      wp.linked_user_id AS user_id,

      wp.karigari_id,

      wp.phone_no,

      u.rating_avg,

      COALESCE(hp.full_name, u.name) AS name,

      hp.email,

      hp.onboarding_stage,

      cd.id AS designation_id,

      COALESCE(cd.name, 'Unassigned') AS designation_name,

      d.id AS department_id,

      d.name AS department_name,

      hp.gender,

      hp.employee_type,

      (${UI_STATUS_SQL}) AS ui_status

    ${BASE_FROM_SQL}

    WHERE ${where.sql}

    ORDER BY ${sortColumn} ${direction}${nulls}, ee.id ASC

    LIMIT ${limitParam} OFFSET ${offsetParam}

  `;



  return { sql, params: where.params };

}



export function rowsToFacetMap(rows: Array<{ facet_key: string | null; count: number }>) {

  const map: Record<string, number> = {};

  for (const row of rows) {

    const key = row.facet_key ?? 'Unassigned';

    map[key] = row.count;

  }

  return map;

}

