import type { DetailTab } from '../stores/use-employee-store';

const TAB_SLUGS: Record<string, DetailTab> = {
  personal: 'Personal Info',
  job: 'Job & Work Info',
  documents: 'Documents',
  bank: 'Bank & Payments',
  attendance: 'Attendance',
  leave: 'Leave',
};

const TAB_TO_SLUG = Object.fromEntries(
  Object.entries(TAB_SLUGS).map(([slug, tab]) => [tab, slug]),
) as Record<DetailTab, string>;

export function detailTabFromSearchParam(value: string | null | undefined): DetailTab {
  if (value && value in TAB_SLUGS) {
    return TAB_SLUGS[value]!;
  }
  return 'Personal Info';
}

export function detailTabToSearchParam(tab: DetailTab): string {
  return TAB_TO_SLUG[tab] ?? 'personal';
}

export function employeeDetailPath(employmentId: string, tab: DetailTab = 'Personal Info'): string {
  const slug = detailTabToSearchParam(tab);
  return slug === 'personal'
    ? `/employees/${employmentId}`
    : `/employees/${employmentId}?tab=${slug}`;
}

export const EMPLOYEE_LIST_PATH = '/employees';
export const EMPLOYEE_ONBOARD_PATH = '/employees/onboard';
