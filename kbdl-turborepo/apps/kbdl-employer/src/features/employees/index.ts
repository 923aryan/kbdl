export {
  EmployeeListScreen,
  EmployeeDetailScreen,
  EmployeeOnboardScreen,
} from './screens/employee-dashboard-screen';
export { useFilteredEmployees } from './hooks/use-employee-hook';
export {
  designations,
  dropdownOptions,
  employees,
  statuses,
  useEmployeeStore,
  type DetailTab,
  type Employee,
  type PaymentMethod,
  type Status,
} from './stores/use-employee-store';
export {
  EMPLOYEE_LIST_PATH,
  EMPLOYEE_ONBOARD_PATH,
  employeeDetailPath,
} from './lib/employee-routes';
