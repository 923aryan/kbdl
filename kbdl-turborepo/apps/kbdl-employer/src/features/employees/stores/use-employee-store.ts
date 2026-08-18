import { create } from 'zustand';

export type Status = 'Active' | 'Inactive' | 'On Boarding' | 'Onboard' | 'On Leave' | 'Probation' | 'Absent';
export type DetailTab =
  | 'Personal Info'
  | 'Job & Work Info'
  | 'Documents'
  | 'Bank & Payments'
  | 'Attendance'
  | 'Leave';
export type PaymentMethod = 'cash' | 'upi' | 'bank';

export type Employee = {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  status: Status;
  rating: number;
  joined: string;
  location: string;
  department: string;
  salary: string;
  jobType?: string;
  /** Backend employment UUID — used for detail API */
  employmentId?: string;
  onboardDetails?: {
    personal: string[][];
    contact: string[][];
    emergency: string[][];
    identity: string[][];
    other: string[][];
    job: string[][];
    work: string[][];
    payroll: string[][];
    bank: string[][];
    payment: string[][];
    documents: string[][];
    notes?: string;
  };
};

const seedEmployees: Employee[] = [
  {
    id: 'EMP92002',
    uid: 'A9B42003',
    name: 'Abhinav Barwal',
    email: 'abhibarwal7321@gmail.com',
    phone: '+91 8894853644',
    designation: 'Electrician',
    status: 'Active',
    rating: 4.7,
    joined: '30 May 2026',
    location: 'Chandigarh',
    department: 'Maintenance',
    salary: '₹ 100,000 / Month',
  },
  {
    id: 'EMP1082',
    uid: 'R7D12091',
    name: 'Aman Barwal',
    email: 'aman.barwal@gmail.com',
    phone: '+91 8894853644',
    designation: 'Electrician',
    status: 'Inactive',
    rating: 4.7,
    joined: '30 May 2026',
    location: 'Delhi',
    department: 'Maintenance',
    salary: '₹ 85,000 / Month',
  },
  {
    id: 'EMP4312',
    uid: 'Q1M88413',
    name: 'Bhavesh Kumar',
    email: 'bhavesh.kumar@gmail.com',
    phone: '+91 8894853690',
    designation: 'Helper',
    status: 'On Boarding',
    rating: 4.3,
    joined: '-',
    location: 'Gujrat',
    department: 'Operations',
    salary: '₹ 28,000 / Month',
  },
  {
    id: 'EMP7754',
    uid: 'P2X66781',
    name: 'Chirag Sharma',
    email: 'chirag.sharma@gmail.com',
    phone: '+91 9823474560',
    designation: 'Machine Operator',
    status: 'On Leave',
    rating: 4.8,
    joined: '30 May 2026',
    location: 'Chandigarh',
    department: 'Production',
    salary: '₹ 48,000 / Month',
  },
  {
    id: 'EMP6901',
    uid: 'L6T99731',
    name: 'Deepak Rana',
    email: 'deepak.rana@gmail.com',
    phone: '+91 9812345600',
    designation: 'Supervisor',
    status: 'Probation',
    rating: 4.5,
    joined: '30 May 2026',
    location: 'Noida',
    department: 'Production',
    salary: '₹ 55,000 / Month',
  },
  {
    id: 'EMP2340',
    uid: 'N8K11933',
    name: 'Gaurav Thakur',
    email: 'gaurav.thakur@gmail.com',
    phone: '+91 9812345601',
    designation: 'Operator',
    status: 'Absent',
    rating: 4.1,
    joined: '30 May 2026',
    location: 'Delhi',
    department: 'Packaging',
    salary: '₹ 34,000 / Month',
  },
  {
    id: 'EMP5987',
    uid: 'H4S66400',
    name: 'Harish Negi',
    email: 'harish.negi@gmail.com',
    phone: '+91 9812345602',
    designation: 'Production worker',
    status: 'Active',
    rating: 4.6,
    joined: '30 May 2026',
    location: 'Gujrat',
    department: 'Production',
    salary: '₹ 32,000 / Month',
  },
  {
    id: 'EMP3349',
    uid: 'B5V78190',
    name: 'Ishan Mehta',
    email: 'ishan.mehta@gmail.com',
    phone: '+91 9812345603',
    designation: 'Assembly Worker',
    status: 'Inactive',
    rating: 4.0,
    joined: '30 May 2026',
    location: 'Chandigarh',
    department: 'Assembly',
    salary: '₹ 30,000 / Month',
  },
  {
    id: 'EMP2290',
    uid: 'C9J33081',
    name: 'Karan Saini',
    email: 'karan.saini@gmail.com',
    phone: '+91 9812345604',
    designation: 'Machine Operator',
    status: 'On Boarding',
    rating: 4.4,
    joined: '-',
    location: 'Delhi',
    department: 'Maintenance',
    salary: '₹ 47,000 / Month',
  },
  {
    id: 'EMP7810',
    uid: 'D3Y12064',
    name: 'Lokesh Verma',
    email: 'lokesh.verma@gmail.com',
    phone: '+91 9812345605',
    designation: 'Senior Technician',
    status: 'On Leave',
    rating: 4.9,
    joined: '30 May 2026',
    location: 'Noida',
    department: 'Maintenance',
    salary: '₹ 70,000 / Month',
  },
];

const generatedEmployees: Employee[] = Array.from({ length: 110 }, (_, index) => {
  const source = seedEmployees[index % seedEmployees.length]!;
  const sequence = index + seedEmployees.length + 1;

  return {
    ...source,
    id: `EMP${9000 + sequence}`,
    uid: `UID${42000 + sequence}`,
    name: `${source.name} ${sequence}`,
    email: source.email.replace('@', `${sequence}@`),
  };
});

export const employees: Employee[] = [...seedEmployees, ...generatedEmployees];

export const designations = [
  'Electrician',
  'Helper',
  'Machine Operator',
  'Operator',
  'Assembly Worker',
  'Production worker',
  'Senior Technician',
  'Supervisor',
];

export const statuses: Status[] = ['Active', 'Inactive', 'On Boarding', 'Onboard', 'On Leave', 'Probation', 'Absent'];

export const dropdownOptions = {
  gender: ['Male', 'Female', 'Other'],
  maritalStatus: ['Unmarried', 'Married', 'Divorced', 'Widowed'],
  blood: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  department: ['Maintenance', 'Production', 'Operations', 'Assembly', 'Packaging'],
  branch: ['Chandigarh Plant 1', 'Delhi Unit', 'Gujrat Factory', 'Noida Site'],
  supervisor: ['Abhinav Barwal', 'Neha Sharma', 'Rahul Thakur', 'Vikas Rana'],
  type: ['Full Time', 'Contract', 'Worker', 'Trainee'],
  shift: ['General Shift', 'Morning Shift', 'Evening Shift', 'Night Shift'],
  skill: ['Electrician', 'Machine Operator', 'Welder', 'Fitter', 'Helper'],
  bank: ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank'],
  salaryType: ['Monthly', 'Daily Wage', 'Hourly'],
  frequency: ['Monthly', 'Weekly', 'Bi-weekly'],
};

interface EmployeeState {
  search: string;
  selectedDesignations: string[];
  selectedStatuses: Status[];
  employeeVersion: number;
  paymentMethod: PaymentMethod;
  uploadOpen: boolean;
  openDropdown: string | null;
  setSearch: (search: string) => void;
  setSelectedDesignations: (designations: string[]) => void;
  setSelectedStatuses: (statuses: Status[]) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setUploadOpen: (open: boolean) => void;
  setOpenDropdown: (dropdown: string | null) => void;
  bumpEmployeeListVersion: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  search: '',
  selectedDesignations: [],
  selectedStatuses: [],
  employeeVersion: 0,
  paymentMethod: 'cash',
  uploadOpen: false,
  openDropdown: null,
  setSearch: (search) => set({ search }),
  setSelectedDesignations: (selectedDesignations) => set({ selectedDesignations }),
  setSelectedStatuses: (selectedStatuses) => set({ selectedStatuses }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setUploadOpen: (uploadOpen) => set({ uploadOpen }),
  setOpenDropdown: (openDropdown) => set({ openDropdown }),
  bumpEmployeeListVersion: () => {
    set((state) => ({ employeeVersion: state.employeeVersion + 1 }));
  },
}));
