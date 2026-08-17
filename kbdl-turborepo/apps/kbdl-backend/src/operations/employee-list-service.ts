import { prisma } from '@repo/db/server';
import {
  EmployerEmployeeFacets,
  EmployerEmployeeListItem,
  GetEmployerEmployeesListQuery,
} from '@repo/types';
import {
  buildFacetQuery,
  buildListQuery,
  buildTotalQuery,
  rowsToFacetMap,
  type EmployeeListFilters,
  type FacetDimension,
} from './employee-list-sql';

type ListRow = {
  employment_id: string;
  employee_no: string | null;
  is_active: boolean;
  separation_reason: string | null;
  joined_at: Date;
  left_at: Date | null;
  workforce_person_id: string;
  user_id: string | null;
  karigari_id: string | null;
  phone_no: string;
  rating_avg: { toNumber?: () => number } | number | null;
  name: string;
  email: string | null;
  onboarding_stage: string | null;
  designation_id: string | null;
  designation_name: string;
  department_id: string | null;
  department_name: string | null;
  gender: string | null;
  employee_type: string | null;
  ui_status: string;
};

type CountRow = { count: number };
type FacetRow = { facet_key: string | null; count: number };

const FACET_DIMENSIONS: FacetDimension[] = [
  'designation',
  'status',
  'gender',
  'department',
  'employee_type',
];

function toNumber(value: ListRow['rating_avg']): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}

function mapListRow(row: ListRow): EmployerEmployeeListItem {
  return {
    employment_id: row.employment_id,
    employee_no: row.employee_no,
    workforce_person_id: row.workforce_person_id,
    user_id: row.user_id,
    karigari_id: row.karigari_id,
    name: row.name,
    email: row.email,
    phone_no: row.phone_no,
    designation: row.designation_name,
    designation_id: row.designation_id,
    department: row.department_name,
    department_id: row.department_id,
    gender: row.gender,
    employee_type: row.employee_type,
    rating: toNumber(row.rating_avg),
    joined_at: row.joined_at.toISOString(),
    left_at: row.left_at?.toISOString() ?? null,
    status: {
      is_active: row.is_active,
      separation_reason: row.separation_reason as EmployerEmployeeListItem['status']['separation_reason'],
      onboarding_stage: row.onboarding_stage,
      ui_status: row.ui_status,
    },
  };
}

function toFilters(companyId: string, query: GetEmployerEmployeesListQuery): EmployeeListFilters {
  return {
    companyId,
    roster: query.roster,
    search: query.search,
    designations: query.designation,
    departments: query.department,
    statuses: query.status,
    genders: query.gender,
    employeeTypes: query.employee_type,
  };
}

async function runFacetQuery(
  filters: EmployeeListFilters,
  dimension: FacetDimension,
): Promise<FacetRow[]> {
  const { sql, params } = buildFacetQuery(filters, dimension);
  return prisma.$queryRawUnsafe<FacetRow[]>(sql, ...params);
}

export const getEmployerEmployeesListService = async (
  companyId: string,
  query: GetEmployerEmployeesListQuery,
): Promise<{
  items: EmployerEmployeeListItem[];
  meta: Record<string, unknown> & { facets: EmployerEmployeeFacets };
}> => {
  const { page = 1, limit = 10, sort = 'joined_at', sort_dir = 'desc' } = query;
  const offset = (page - 1) * limit;
  const filters = toFilters(companyId, query);

  const listQuery = buildListQuery(filters, {
    sort,
    sortDir: sort_dir,
    limit,
    offset,
  });
  const totalQuery = buildTotalQuery(filters);

  const [listRows, totalRows, ...facetResults] = await Promise.all([
    prisma.$queryRawUnsafe<ListRow[]>(listQuery.sql, ...listQuery.params),
    prisma.$queryRawUnsafe<CountRow[]>(totalQuery.sql, ...totalQuery.params),
    ...FACET_DIMENSIONS.map((dimension) => runFacetQuery(filters, dimension)),
  ]);

  const total = totalRows[0]?.count ?? 0;
  const [designationRows, statusRows, genderRows, departmentRows, employeeTypeRows] = facetResults;

  const facets: EmployerEmployeeFacets = {
    designation: rowsToFacetMap(designationRows ?? []),
    status: rowsToFacetMap(statusRows ?? []),
    gender: rowsToFacetMap(genderRows ?? []),
    department: rowsToFacetMap(departmentRows ?? []),
    employee_type: rowsToFacetMap(employeeTypeRows ?? []),
  };

  return {
    items: listRows.map(mapListRow),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      facets,
    },
  };
};
