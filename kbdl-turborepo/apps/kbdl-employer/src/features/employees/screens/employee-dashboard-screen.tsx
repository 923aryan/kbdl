'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  HelpCircle,
  IdCard,
  Info,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  UploadCloud,
  User,
  Users,
  WalletCards,
  Wrench,
  X,
} from 'lucide-react';

import { useFilteredEmployees } from '../hooks/use-employee-hook';
import {
  designations,
  dropdownOptions,
  statuses,
  useEmployeeStore,
  type DetailTab,
  type Employee,
  type PaymentMethod,
  type Status,
} from '../stores/use-employee-store';

const detailTabs: DetailTab[] = [
  'Personal Info',
  'Job & Work Info',
  'Documents',
  'Bank & Payments',
  'Attendance',
  'Leave',
];

const statusStyle: Record<Status, string> = {
  Active: 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]',
  Inactive: 'border-[#525252] bg-[#E5E5E5] text-[#525252]',
  'On Boarding': 'border-[#0658C2] bg-[#DBEAFF] text-[#0658C2]',
  'On Leave': 'border-[#FFA000] bg-[#FFF4E3] text-[#FFA000]',
  Probation: 'border-[#8B5CF6] bg-[#EDE9FE] text-[#8B5CF6]',
  Absent: 'border-[#F54A4A] bg-[#FEE9E5] text-[#F54A4A]',
};

export const EmployeeDashboardScreen = () => {
  const {
    mode,
    selectedEmployee,
    activeTab,
    search,
    selectedDesignations,
    selectedStatuses,
    paymentMethod,
    uploadOpen,
    setMode,
    setSelectedEmployee,
    setActiveTab,
    setSearch,
    setSelectedDesignations,
    setSelectedStatuses,
    setPaymentMethod,
    setUploadOpen,
  } = useEmployeeStore();

  const filteredEmployees = useFilteredEmployees({
    search,
    selectedDesignations,
    selectedStatuses,
  });

  const openDetails = (employee: Employee, tab: DetailTab = 'Personal Info') => {
    setSelectedEmployee(employee);
    setActiveTab(tab);
    setMode('details');
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#111827]">
      <TopBar />
      <main className="p-[20px]">
        {mode === 'list' && (
          <EmployeeList
            employees={filteredEmployees}
            search={search}
            selectedDesignations={selectedDesignations}
            selectedStatuses={selectedStatuses}
            onSearch={setSearch}
            onDesignations={setSelectedDesignations}
            onStatuses={setSelectedStatuses}
            onAdd={() => setMode('add')}
            onView={openDetails}
          />
        )}

        {mode === 'details' && (
          <EmployeeDetails
            employee={selectedEmployee}
            activeTab={activeTab}
            onTab={setActiveTab}
            onBack={() => setMode('list')}
            onUpload={() => setUploadOpen(true)}
          />
        )}

        {mode === 'add' && (
          <AddEmployee
            paymentMethod={paymentMethod}
            onPaymentMethod={setPaymentMethod}
            onBack={() => setMode('list')}
          />
        )}
      </main>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </div>
  );
};

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-[315px]">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#676767]" />
        <input
          className="h-12 w-full rounded-lg bg-[#FAFAFA] pl-12 pr-4 text-sm outline-none ring-1 ring-transparent focus:ring-blue-500"
          placeholder="Search anything..."
        />
      </div>
      <div className="flex items-center gap-5">
        <button className="relative rounded-full p-2 text-[#676767] hover:bg-[#FAFAFA]" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-blue-600" />
        </button>
        <button className="rounded-full p-2 text-[#676767] hover:bg-[#FAFAFA]" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="hidden h-10 w-px bg-gray-200 sm:block" />
        <div className="flex items-center gap-3">
          <Avatar name="Abhinav Barwal" size="md" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Abhinav Barwal</p>
            <p className="text-xs text-[#676767]">Operations Head</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function EmployeeList({
  employees,
  search,
  selectedDesignations,
  selectedStatuses,
  onSearch,
  onDesignations,
  onStatuses,
  onAdd,
  onView,
}: {
  employees: Employee[];
  search: string;
  selectedDesignations: string[];
  selectedStatuses: Status[];
  onSearch: (value: string) => void;
  onDesignations: (value: string[]) => void;
  onStatuses: (value: Status[]) => void;
  onAdd: () => void;
  onView: (employee: Employee) => void;
}) {
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(employees.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedEmployees = employees.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <section className="rounded-[20px] border border-[#D3D3D3] bg-white p-[20px] shadow-sm ">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">EMPLOYEES</h1>
          <p className="mt-1 text-sm text-[#676767]">Manage Your Employee</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0658C2] px-8 text-base font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add New Onboard
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row xl:items-center xl:justify-between">
        <div className="relative max-w-full sm:max-w-[500px] flex-1">
          <Search className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="h-12 w-full rounded-lg border border-gray-300 px-6 pr-14 text-sm outline-none focus:border-[#0658C2]"
            placeholder="Search Employee..."
          />
        </div>
        <div className="flex flex-row flex-wrap  gap-4 sm:flex-row">
          <MultiSelect
            label="All Designations"
            selectedLabel="Designation"
            options={designations}
            selected={selectedDesignations}
            onChange={onDesignations}
          />
          <MultiSelect
            label="All Status"
            selectedLabel="Status"
            options={statuses}
            selected={selectedStatuses}
            onChange={(items) => onStatuses(items as Status[])}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left rounded-t-[12px] overflow-hidden">
          <thead>
            <tr className="bg-[#FAFAFA] text-sm font-semibold text-[#676767]">
              <th className="px-5 py-[10px]">Employee Name</th>
              <th className="px-5 py-[10px]">ID & Designation</th>
              <th className="px-5 py-[10px]">Phone</th>
              <th className="px-5 py-[10px]">Rating</th>
              <th className="px-5 py-[10px]">Date of Joined</th>
              <th className="px-5 py-[10px]">Status</th>
              <th className="px-5 py-[10px] text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="border-b border-[#D3D3D3] text-sm">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={employee.name} size="sm" />
                    <div>
                      <p className="font-medium leading-4">{employee.name}</p>
                      <p className="text-xs text-[#676767]">{employee.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium leading-4">{employee.designation}</p>
                  <p className="text-xs text-[#676767]">ID: {employee.id}</p>
                </td>
                <td className="px-5 py-3">{employee.phone}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[#FFA000] text-[#FFA000]" />
                    {employee.rating}
                  </span>
                </td>
                <td className="px-5 py-3">{employee.joined}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={employee.status} />
                </td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => onView(employee)}
                    className="rounded-full p-2 text-[#0658C2] hover:bg-[#DBEAFF] cursor-pointer"
                    aria-label={`View ${employee.name}`}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={activePage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </section>
  );
}

function MultiSelect({
  label,
  selectedLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  selectedLabel: string;
  options: string[];
  selected: string[];
  onChange: (items: string[]) => void;
}) {
  const { openDropdown, setOpenDropdown } = useEmployeeStore();
  const dropdownId = `filter-${selectedLabel}`;
  const open = openDropdown === dropdownId;
  const selectedText = selected.length ? `${selectedLabel} (${selected.length})` : label;

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(
    (option) =>
      !selected.includes(option) &&
      option.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenDropdown(open ? null : dropdownId)}
        className={`flex h-12 min-w-[210px] items-center justify-between rounded-xl border px-6 text-base font-semibold cursor-pointer ${
          open ? 'border-[#0658C2] text-blue-950' : 'border-gray-300 text-gray-900'
        }`}
      >
        {selectedText}
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 z-30 mt-2 w-[212px] sm:w-[300px] rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${selectedLabel === 'Status' ? 'Status' : 'Designation'}...`}
              className="w-full rounded-md border border-transparent bg-[#F8F8F8] px-[16px] py-[9px] text-[14px] outline-none focus:border-[#0658C2]"
            />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#000000]">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <button
            onClick={() => onChange(options)}
            className="flex w-full items-center justify-between rounded-md bg-[#DBEAFF] px-[16px] py-[9px] text-left text-[#0658C2] text-[14px]"
          >
            {label}
            <span className="relative h-4 w-4 rounded bg-white">
              <span className="absolute inset-0 bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] top-[-2px] left-[2px] bg-no-repeat w-[22px]" />
            </span>
          </button>

          {selected.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
                <span>Selected ({selected.length})</span>

                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="normal-case text-[#0658C2] cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-[260px] overflow-y-auto space-y-1 border-b border-[#D3D3D3] pb-3">
                {selected.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggle(option)}
                    className="flex w-full items-center justify-between rounded-md bg-[#DBEAFF] px-[16px] py-[9px] text-[14px] text-left text-[#0658C2] cursor-pointer"
                  >
                    {option}

                    <span className="relative h-4 w-4 rounded bg-white">
                      <span className="absolute inset-0 bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] top-[-2px] left-[2px] bg-no-repeat w-[22px]" />
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
            Available {selectedLabel === 'Status' ? 'Statuses' : 'Designations'}
          </p>

          <div className="max-h-[260px] space-y-1 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggle(option)}
                  className="group flex w-full items-center justify-between rounded-md border border-[#D3D3D3] px-[16px] py-[9px] text-[14px] text-left hover:bg-[#DBEAFF] cursor-pointer hover:border-transparent hover:text-[#0658C2]"
                >
                  {option}

                  <span className="h-4 w-4 rounded border border-[#D3D3D3] group-hover:bg-white group-hover:border-transparent" />
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-[#676767]">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeDetails({
  employee,
  activeTab,
  onTab,
  onBack,
  onUpload,
}: {
  employee: Employee;
  activeTab: DetailTab;
  onTab: (tab: DetailTab) => void;
  onBack: () => void;
  onUpload: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-[#D3D3D3] bg-white p-[20px] shadow-sm">
      <PageTitle title="Employee Details" crumb="Employees > Employee Details" onBack={onBack} />
      <EmployeeHero employee={employee} />
      <div className="mt-5 grid rounded-xl border border-[#D3D3D3] bg-white shadow-sm sm:grid-cols-3 lg:grid-cols-6 overflow-hidden">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTab(tab)}
            className={`h-12 border-b-2 text-sm font-semibold text-[#0658C2] cursor-pointer ${
              activeTab === tab ? 'border-[#0658C2]' : 'border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {activeTab === 'Personal Info' && <PersonalInfo />}
        {activeTab === 'Job & Work Info' && <JobWorkInfo />}
        {activeTab === 'Documents' && <DocumentsTab onUpload={onUpload} />}
        {activeTab === 'Bank & Payments' && <BankPayments />}
        {activeTab === 'Attendance' && <Attendance />}
        {activeTab === 'Leave' && <LeaveTab />}
      </div>
    </section>
  );
}

function EmployeeHero({ employee }: { employee: Employee }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: employee.name,
    designation: employee.designation,
    phone: employee.phone,
    email: employee.email,
    location: employee.location,
    department: employee.department,
    salary: employee.salary,
  });

  const heroInput = (key: keyof typeof draft, className = '') => (
    <input
      value={draft[key]}
      onChange={(event) => setDraft((value) => ({ ...value, [key]: event.target.value }))}
      className={`rounded-md border border-[#D3D3D3] px-3 py-1 outline-none focus:border-[#0658C2] ${className}`}
    />
  );

  return (
    <div className="mt-6 rounded-xl border border-[#D3D3D3] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar name={employee.name} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-4">
              {editing ? (
                heroInput('name', 'text-2xl font-bold uppercase')
              ) : (
                <h2 className="text-2xl font-bold uppercase">{draft.name}</h2>
              )}
              <StatusBadge status="Active" />
              <span className="inline-flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                {employee.rating}
              </span>
            </div>
            {editing ? (
              heroInput('designation', 'mt-2 text-lg font-semibold')
            ) : (
              <p className="text-lg font-semibold">{draft.designation}</p>
            )}
            <p className="mt-1 text-sm text-[#676767]">
              EMP ID :- {employee.id} <span className="mx-4">|</span> UID :- {employee.uid}
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              {editing ? (
                <>
                  <EditableIconLine icon={Phone}>{heroInput('phone')}</EditableIconLine>
                  <EditableIconLine icon={Mail}>{heroInput('email')}</EditableIconLine>
                </>
              ) : (
                <>
                  <IconLine icon={Phone} text={draft.phone} />
                  <IconLine icon={Mail} text={draft.email} />
                </>
              )}
              <IconLine
                icon={MapPin}
                text="H. No. 220, Village Bir, Teh Joginder Nager, Distt Mandi (HP) - 175032"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-5 border-[#D3D3D3] grid-cols-2 xl:border-l xl:pl-8">
          <HeroMetric icon={Calendar} label="Date of Joining" value="06 June 2026" />
          <HeroMetric icon={MapPin} label="Work Location" value={draft.location} editable={editing} onChange={(value) => setDraft((item) => ({ ...item, location: value }))} />
          <HeroMetric icon={Users} label="Reporting Manager" value="Abhinav Barwal" />
          <HeroMetric icon={Briefcase} label="Job Type" value="Full Time" />
          <HeroMetric icon={Building2} label="Department" value={draft.department} editable={editing} onChange={(value) => setDraft((item) => ({ ...item, department: value }))} />
          <HeroMetric icon={CreditCard} label="Salary" value={draft.salary} editable={editing} onChange={(value) => setDraft((item) => ({ ...item, salary: value }))} />
        </div>
      </div>
      {/* <button
        type="button"
        onClick={() => setEditing((value) => !value)}
        className="float-right -mt-2 inline-flex items-center gap-1 text-sm text-[#0658C2]">
        <Edit3 className="h-4 w-4" /> {editing ? 'Save' : 'Edit'}
      </button> */}
    </div>
  );
}

function PersonalInfo() {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <InfoCard title="Personal Information" icon={IdCard} rows={[
        ['Full Name', 'Aman Barwal'],
        ['Date of Birth', '09 April 2002'],
        ['Gender', 'Male'],
        ['Marital Status', 'Unmarried'],
        ["Father's Name", 'Suresh Yadav'],
        ["Mother's Name", 'Kamla Devi'],
        ['Nationality', 'Indian'],
        ['Religion', 'Hindu'],
        ['Language Known', 'Hindi, Basic English'],
        ['Blood Group', 'AB+'],
      ]} />
      <div className="space-y-4">
        <InfoCard title="Contact Information" icon={Phone} rows={[
          ['Mobile Number', '+91 8894853644'],
          ['Alternate Number', '+91 7865784536'],
          ['Email', 'abhi7321@gmail.com'],
          ['Present Address', 'H. No. 220, Village Bir, Teh Joginder Nager, Distt Mandi (HP) - 175032'],
          ['Permanent Address', 'H. No. 220, Village Bir, Teh Joginder Nager, Distt Mandi (HP) - 175032'],
        ]} />
                </div>
        <div className="space-y-4">
        <InfoCard title="Emergency Contact" icon={Phone} rows={[
          ['Contact Name', 'Suresh Yadav'],
          ['Relation', 'Father'],
          ['Mobile Number', '+91 8894853644'],
        ]} />

      </div>
      <div className="space-y-4">
        <InfoCard title="Identity Details" icon={IdCard} rows={[
          ['Aadhaar Number', 'xxxx-xxxx-1234'],
          ['PAN Number', 'ABCDE1234F'],
          ['Voter ID', 'HP/07/2020/12345'],
          ['Driving License', '-'],
          ['UAN Number', '102345678978'],
          ['ESI Number', '5738453657'],
          ['PF Number', 'HP/FRT/12546/000'],
        ]} />
      </div>
      <div className="space-y-4">
        <InfoCard title="Other Information" icon={Briefcase} rows={[
          ['Employee Type', 'Worker'],
          ['Probation Period', '3 Months'],
          ['Notice Period', '15 Days'],
          ['Working Timing', ''],
          ['Weekly Off', 'Sunday'],
        ]} />
      </div>
    </div>
  );
}

function JobWorkInfo() {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <InfoCard title="Job Information" icon={Briefcase} rows={[
        ['Department', 'Maintenance'],
        ['Job Title', 'Electrician'],
        ['Job Role', 'Electrician'],
        ['Job Type', 'Full Time'],
        ['Work Location', 'Chandigarh Plant 1'],
        ['Date of Joining', '02 June 2026'],
        ['Confirmation Date', '02 Sep 2026'],
        ['Employee Status', 'Active'],
      ]} />
      <InfoCard title="Work Details" icon={Wrench} rows={[
        ['Shift', 'General Shift'],
        ['Working Time', '06:00 AM - 05:00PM'],
        ['Break Time', '01:00 PM - 02:00PM'],
        ['Weekly Off', 'Sunday'],
        ['Overtime Eligible', 'Yes'],
        ['Overtime Type', 'Paid'],
        ['Travel Required', 'No'],
      ]} />
      <InfoCard title="Reporting & Payroll" icon={Users} rows={[
        ['Reporting Manager', 'Abhinav Barwal'],
        ['Payroll Group', 'Monthly Paid Worker'],
        ['Pay Schedule', 'Monthly'],
        ['Salary Structure', 'Electrician - Grade 2'],
        ['CTC', '₹ 100,000 / Month'],
        ['Payment Mode', 'Bank Transfer'],
      ]} />
    </div>
  );
}

function DocumentsTab({ onUpload }: { onUpload: () => void }) {
  const [documents, setDocuments] = useState([
    ['Aadhaar Card', 'XXXX-XXXX-5476', '30 May 2025', '-', 'Uploaded'],
    ['PAN Card', 'DFGTH6745A', '30 May 2025', '-', 'Uploaded'],
    ['Driving License', 'HP29 5676XXXX', '30 May 2025', '09 June 2032', 'Uploaded'],
    ['Education Certificate', '-', '30 May 2025', '-', 'Uploaded'],
    ['Experience Certificate', 'EMP/2023/4657', '30 May 2025', '-', 'Uploaded'],
    ['Medical Fitness Certificate', 'MED/00067/0095', '30 May 2025', '01 June 2026', 'Expired'],
    ['Police Verification', '-', '-', '-', 'Pending Upload'],
    ['Passport Size Photo', '-', '-', '-', 'Pending Upload'],
  ]);
  const [editingRows, setEditingRows] = useState<number[]>([]);
  const updateDocument = (rowIndex: number, cellIndex: number, value: string) => {
    setDocuments((items) =>
      items.map((row, index) =>
        index === rowIndex
          ? row.map((cellValue, currentCellIndex) =>
              currentCellIndex === cellIndex ? value : cellValue,
            )
          : row,
      ),
    );
  };
  const addDocument = () => {
    setDocuments((items) => [...items, ['New Document', '', '', '', 'Pending Upload']]);
    setEditingRows((items) => [...items, documents.length]);
  };

  return (
    <div className="outer-main">
      <div className="table-data overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm rounded-t-[12px] overflow-hidden">
          <thead>
            <tr className="bg-[#FAFAFA] text-[#676767]">
              <th className="px-5 py-[10px]">Document Type</th>
              <th className="px-5 py-[10px]">Document Number</th>
              <th className="px-5 py-[10px]">Uploaded On</th>
              <th className="px-5 py-[10px]">Expiry Date</th>
              <th className="px-5 py-[10px]">Status</th>
              <th className="px-5 py-[10px] text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(([type, number, uploaded, expiry, status], rowIndex) => {
              const editing = editingRows.includes(rowIndex);
              return (
              <tr key={type} className="border-b border-[#D3D3D3]">
                {[type, number, uploaded, expiry].map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-4">
                    {editing ? (
                      <input
                        value={cell}
                        onChange={(event) => updateDocument(rowIndex, cellIndex, event.target.value)}
                        className="h-9 w-full rounded-md border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
                      />
                    ) : (
                      cell
                    )}
                  </td>
                ))}
                <td className="px-5 py-4">
                    <span
                      className={`rounded-md border px-4 py-1.5 text-xs font-semibold [display:ruby] ${
                        status === 'Expired'
                          ? 'border-red-500 bg-[#FEE9E5] text-red-600'
                          : status === 'Pending Upload'
                            ? 'border-[#0658C2] bg-[#DBEAFF] text-[#0658C2]'
                            : 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]'
                      }`}
                    >
                      {status}
                    </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-center gap-3 text-[#0658C2]">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRows((items) =>
                          editing ? items.filter((item) => item !== rowIndex) : [...items, rowIndex],
                        )
                      }
                    >
                      {editing ? 'Save' : 'Edit'}
                    </button>
                    {status === 'Pending Upload' ? (
                      <button type="button" onClick={onUpload}>
                        Upload
                      </button>
                    ) : (
                      <>
                      <button onClick={onUpload} aria-label={`View ${type}`}>
                        <Eye className="h-5 w-5" />
                      </button>
                      <button aria-label={`Download ${type}`}>
                        <Download className="h-5 w-5" />
                      </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      <button
        onClick={addDocument}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 border border-[#0658C2] text-sm font-semibold text-[#0658C2]">
        <Plus className="h-4 w-4" /> ADD DOCUMENT
      </button>
    </div>
  );
}

function BankPayments() {
  const history = Array.from({ length: 10 }, (_, index) => ({
    id: index,
    month: 'May 2026',
    payDate: '31 May 2026',
    paidDays: 26,
    gross: '₹ 100,000',
    deductions: '₹ 35,000',
    net: '₹ 65,000',
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <InfoCard title="Bank Details" icon={Landmark} rows={[
          ['Bank Name', 'State Bank of India'],
          ['Account Number', '100085678394'],
          ['IFSC Code', 'ADHF000678'],
          ['Branch', 'Chauntra'],
          ['Account Holder Name', 'Abhinav Barwal'],
          ['Account Type', 'Savings'],
        ]} />
        <InfoCard title="Salary & Payment Details" icon={WalletCards} rows={[
          ['Payroll Group', 'Monthly Paid Worker'],
          ['Payroll Schedule', 'Monthly'],
          ['Payment Mode', 'Bank Transfer'],
          ['Salary Structure', 'Electrician - Grade 2'],
          ['Basic Salary', '₹ 65,000'],
          ['Allowances', '₹ 35,000'],
          ['Total Salary (CTC)', '₹ 100,000 / Month'],
          ['Effective Form', '02 June 2026'],
        ]} />
      </div>
      <div className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
        <SectionHeading icon={Clock} title="Payment History" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#676767]">
                {['Month', 'Pay Date', 'Paid Days', 'Gross Salary', 'Deductions', 'Net Pay', 'Payslip'].map((head) => (
                  <th key={head} className="px-5 py-4">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-[#D3D3D3]">
                  <td className="px-5 py-4">{item.month}</td>
                  <td className="px-5 py-4">{item.payDate}</td>
                  <td className="px-5 py-4">{item.paidDays}</td>
                  <td className="px-5 py-4">{item.gross}</td>
                  <td className="px-5 py-4">{item.deductions}</td>
                  <td className="px-5 py-4">{item.net}</td>
                  <td className="px-5 py-4 text-[#0658C2]">
                    <Download className="h-5 w-5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={1} totalPages={1} onPageChange={() => undefined} />
      </div>
    </div>
  );
}

function Attendance() {
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 5, 1));
  const [legendsOpen, setLegendsOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(true);
  const calendarDays = useMemo(() => buildCalendarDays(calendarDate), [calendarDate]);
  const monthLabel = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const changeMonth = (offset: number) => {
    setCalendarDate((date) => new Date(date.getFullYear(), date.getMonth() + offset, 1));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#D3D3D3] shadow-sm overflow-x-auto">
        <div className="calendar min-w-[900px]">
          <div className="flex items-center justify-between px-5 py-4">
            <button type="button" onClick={() => changeMonth(-1)} className="inline-flex items-center gap-2 text-[#676767]">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <h3 className="text-2xl font-semibold">{monthLabel}</h3>
            <button type="button" onClick={() => changeMonth(1)} className="inline-flex items-center gap-2 text-[#676767]">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-t border-[#D3D3D3] bg-[#FAFAFA] text-sm font-semibold text-[#676767]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-4 py-3">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map(({ day, code, muted }, index) => (
              <div
                key={`${day}-${index}`}
                className={`min-h-[92px] border-r border-t border-[#D3D3D3] p-3 text-sm hover:bg-[#e7effb] ${muted ? 'text-gray-300' : 'text-[#676767]'} ${
                  code === 'P'
                    ? 'bg-[#E5FFEB]'
                    : code === 'A'
                      ? 'bg-[#FEE9E5]'
                      : code === 'L'
                        ? 'bg-[#EDE9FE]'
                        : code === 'H'
                          ? 'bg-[#DBEAFF]'
                          : code === 'OF'
                            ? 'bg-[#F4F4F4]'
                            : 'bg-white'
                }`}
              >
                <span>{day.toString().padStart(2, '0')}</span>
                {code && (
                  <div className={`mt-2 text-center font-semibold ${legendColor(code)}`}>{code}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <CollapsibleTitle title="Legends" open={legendsOpen} onToggle={() => setLegendsOpen((value) => !value)} />
      {legendsOpen && (
        <div className="grid gap-3 rounded-xl border border-[#D3D3D3] p-4 text-sm text-[#676767] shadow-sm sm:grid-cols-3 xl:grid-cols-6">
          {([
            ['P', 'Present'],
            ['A', 'Absent'],
            ['OF', 'Off Day'],
            ['L', 'Leave'],
            ['P', 'Alert for Deduction'],
            ['H', 'Holiday'],
          ] as [string, string][]).map(([code, label]) => (
            <span key={label} className="inline-flex items-center gap-3">
              <span className={`px-1.5 text-xs font-semibold ${legendChip(code)}`}>{code}</span>
              {label}
            </span>
          ))}
        </div>
      )}
      <CollapsibleTitle title="Attendance Log" open={logOpen} onToggle={() => setLogOpen((value) => !value)} />
      {logOpen && (
        <DataTable
          headers={['Date', 'Time', 'Location']}
          rows={[
            ['03 June 2026', '06:06:43 am', 'Chandigarh'],
            ['03 June 2026', '12:02:23 pm', 'Chandigarh'],
            ['03 June 2026', '02:25:50 pm', 'Chandigarh'],
            ['03 June 2026', '05:45:34 pm', 'Chandigarh'],
          ]}
        />
      )}
    </div>
  );
}

function LeaveTab() {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const requests = Array.from({ length: 8 }, (_, index) => [
    'Casual Leave',
    `${15 + index} Jun 2026`,
    `${17 + index} Jun 2026`,
    '3',
    'Personal work',
    index === 3 || index === 6 ? 'Rejected' : 'Approved',
    '03 Jun 2026',
  ]);
  const filteredRequests = requests.filter((row) => {
    const from = parseDisplayDate(row[1] ?? '');
    const to = parseDisplayDate(row[2] ?? '');
    const rangeFrom = dateRange.from ? new Date(dateRange.from) : null;
    const rangeTo = dateRange.to ? new Date(dateRange.to) : null;

    return (!rangeFrom || to >= rangeFrom) && (!rangeTo || from <= rangeTo);
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
          <h3 className="text-2xl font-semibold">Leave Balance</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <LeaveBalanceCard title="Available Leave Balance" value="8.0" note="As on 6 June 2024" color="green" />
            <LeaveBalanceCard title="Unused Leaves (This Year)" value="6.0" note="01 Jan 2025 - 31 Dec 2025" color="violet" />
            <LeaveBalanceCard title="Pending Leaves" value="1.0" note="Approval Pending" color="orange" />
          </div>
        </div>
        <div className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
          <h3 className="text-2xl font-semibold">Leave Policy</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#676767]">
            {[
              'Earn 1 leave every month',
              'Leave balance updates monthly',
              'Max 12 leaves carry forward from previous year',
              'Carry forward applies only at year-end',
              'Excess leaves may be encashed as per policy',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#0658C2]">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Leave Request</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setRangeOpen((value) => !value)}
            className="inline-flex h-12 items-center justify-center gap-6 rounded-lg border border-gray-300 px-6 font-semibold"
          >
            Date Range {rangeOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {rangeOpen && (
            <div className="absolute right-0 z-30 mt-2 grid w-[320px] gap-3 rounded-xl border border-[#D3D3D3] bg-white p-4 shadow-xl">
              <label className="grid gap-1 text-sm font-semibold">
                From
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(event) => setDateRange((value) => ({ ...value, from: event.target.value }))}
                  className="h-11 rounded-lg border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                To
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(event) => setDateRange((value) => ({ ...value, to: event.target.value }))}
                  className="h-11 rounded-lg border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
                />
              </label>
              <button
                type="button"
                onClick={() => setDateRange({ from: '', to: '' })}
                className="justify-self-end text-sm font-semibold text-[#0658C2]"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#D3D3D3] shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="bg-[#FAFAFA] text-[#676767]">
              {['Leave Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Applied On'].map((head) => (
                <th key={head} className="px-5 py-4">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((row, index) => (
              <tr key={index} className="border-b border-[#D3D3D3] text-[#676767]">
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="px-5 py-4">
                    {cellIndex === 5 ? (
                      <span className={`rounded-md border px-4 py-1.5 text-xs font-semibold ${
                        cell === 'Approved'
                          ? 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]'
                          : 'border-red-500 bg-[#FEE9E5] text-red-600'
                      }`}>
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="text-2xl font-semibold">Leave Type Balance</h3>
      <DataTable
        headers={['Leave Type', 'Earned This year', 'Used', 'Pending', 'Current Year Balance', 'Carry Forward (2025)', 'Total Balance']}
        rows={[['Casual Leave', '5 Days', '2 Days', '1 Day', '2 Days', '6 Days', '8 Days']]}
      />
      <div className="flex items-start gap-3 rounded-xl bg-[#DBEAFF] p-4 text-blue-950">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0658C2]" />
        <p className="text-sm">
          <strong>Note:</strong> Up to 12 unused leaves can be carried forward. Excess leave balance will be encashed and credited to the employee&apos;s bank account or paid through an approved payment method, as per company policy.
        </p>
      </div>
    </div>
  );
}

function parseDisplayDate(value: string) {
  const [day, month, year] = value.split(' ');
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(
    month ?? '',
  );

  return new Date(Number(year), monthIndex, Number(day));
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const displayedDay =
      dayNumber < 1 ? previousMonthDays + dayNumber : dayNumber > daysInMonth ? dayNumber - daysInMonth : dayNumber;
    const currentDate = new Date(year, month, Math.min(Math.max(dayNumber, 1), daysInMonth));
    const statusMap: Record<number, string> = {
      1: 'A',
      2: 'P',
      3: 'L',
      4: 'L',
      5: 'P',
      17: 'H',
    };
    const code = inCurrentMonth ? statusMap[dayNumber] ?? (currentDate.getDay() === 0 ? 'OF' : '') : '';

    return { day: displayedDay, code, muted: !inCurrentMonth };
  });
}

function AddEmployee({
  paymentMethod,
  onPaymentMethod,
  onBack,
}: {
  paymentMethod: PaymentMethod;
  onPaymentMethod: (method: PaymentMethod) => void;
  onBack: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-[#D3D3D3] bg-white p-5 shadow-sm sm:p-7">
      <PageTitle title="ADD NEW EMPLOYEE" crumb="Employee > Add New Employee" onBack={onBack} />
      <div className="mt-6 space-y-4">
        <FormPanel title="Personal Information" icon={IdCard}>
          <Field label="Full Name" required placeholder="Enter full name" />
          <Field label="Mobile Number" required placeholder="Enter mobile number" />
          <Field label="Date of Birth" required placeholder="DD / MM / YYYY" icon={Calendar} />
          <SelectField label="Gender" required placeholder="Select Gender" options={dropdownOptions.gender} />
          <Field label="Address" required placeholder="Enter complete address" />
          <SelectField label="Blood Group" required placeholder="Select Blood Group" options={dropdownOptions.blood} />
          <Field label="Emergency Contact Name" required placeholder="Enter emergency contact name" />
          <Field label="Emergency Contact Relation" required placeholder="Enter emergency contact relation" />
          <Field label="Emergency Contact Number" required placeholder="Enter emergency contact number" />
        </FormPanel>

        <FormPanel title="Job Information" icon={Briefcase}>
          <SelectField label="Designation" required placeholder="Select Designation" options={designations} />
          <SelectField label="Department" required placeholder="Select Department" options={dropdownOptions.department} />
          <SelectField label="Branch / Location" required placeholder="Select Branch" options={dropdownOptions.branch} />
          <SelectField label="Reporting Supervisor" required placeholder="Select Supervisor" options={dropdownOptions.supervisor} />
          <SelectField label="Employee Type" required placeholder="Select Employee Type" options={dropdownOptions.type} />
          <Field label="Joining Date" required placeholder="DD / MM / YYYY" icon={Calendar} />
          <SelectField label="Shift Assignment" required placeholder="Select Shift" options={dropdownOptions.shift} />
          <Field label="Work Location / Site" placeholder="Enter work location or site" />
        </FormPanel>

        <div className="grid gap-4 xl:grid-cols-2">
          <FormPanel title="Work Details" icon={Wrench} columns="single">
            <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Skill / Trade" required placeholder="Select Skill / Trade" options={dropdownOptions.skill} />
              <Field label="Experience (Years)" required placeholder="Enter experience in years" />
            </div>
             <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Certification / Licenses" placeholder="Enter Certifications (if any)" />
              <RadioGroup label="Safety Training Completed" required options={['Yes', 'No']} value="Yes" />
             </div>
          </FormPanel>
          <FormPanel title="Payment Method" icon={CreditCard} columns="single">
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentOption label="Cash Payment" active={paymentMethod === 'cash'} onClick={() => onPaymentMethod('cash')} />
              <PaymentOption label="Bank Tranfer" active={paymentMethod === 'bank'} onClick={() => onPaymentMethod('bank')} />
              <PaymentOption label="UPI Transfer" active={paymentMethod === 'upi'} onClick={() => onPaymentMethod('upi')} />
            </div>
          </FormPanel>
        </div>

        {paymentMethod === 'upi' && (
          <FormPanel title="UPI Transfer" icon={WalletCards}>
            <Field label="UPI ID" required placeholder="Enter UPI ID" />
            <Field label="Name on UPI" required placeholder="Enter name on UPI" />
            <Field label="Wage Amount" required placeholder="Enter wage amount" />
            <SelectField label="Payment Frequency" required placeholder="Select Frequency" options={dropdownOptions.frequency} />
          </FormPanel>
        )}

        {paymentMethod === 'bank' && (
          <>
            <FormPanel title="Bank Details" icon={Landmark}>
              <Field label="Account Holder Name" required placeholder="Enter Account Holder Name" />
              <Field label="Account Number" required placeholder="Enter Account Number" />
              <SelectField label="Bank Name" required placeholder="Select Shift" options={dropdownOptions.bank} />
              <Field label="IFSC Code" required placeholder="Enter IFSC Code" />
            </FormPanel>
            <div className="grid gap-4 xl:grid-cols-2">
              <FormPanel title="Identity Documents" icon={IdCard} columns="single">
                <Field label="Aadhaar Number" required placeholder="Enter Aadhaar Number" />
                <Field label="PAN Number" required placeholder="Enter PAN Number" />
                <Field label="Driving License Number (if applicable)" placeholder="Enter Driving License Number" />
                <UploadBox label="Upload Documents" required />
              </FormPanel>
              <FormPanel title="Salery Details" icon={WalletCards} columns="single">
                <Field label="Basic Salary / Wage" required placeholder="Enter amount" />
                <SelectField label="Salary / Wage Type" required placeholder="Select Type" options={dropdownOptions.salaryType} />
                <SelectField label="Payment Frequency" required placeholder="Select Frequency" options={dropdownOptions.frequency} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <RadioGroup label="Overtime Eligible" required options={['Yes', 'No']} value="Yes" />
                  <RadioGroup label="PF Applicable" required options={['Yes', 'No']} value="Yes" />
                  <RadioGroup label="ESI Applicable" required options={['Yes', 'No']} value="Yes" />
                </div>
              </FormPanel>
            </div>
          </>
        )}

        <FormPanel title="Additional Documents & Notes" icon={FileText}>
          <UploadBox label="Additional Documents" />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Notes (Optional)</span>
            <textarea
              className="h-[150px] w-full resize-none rounded-lg border border-[#D3D3D3] px-4 py-3 text-sm outline-none focus:border-[#0658C2]"
              placeholder="Enter any additional notes"
            />
          </label>
        </FormPanel>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-end">
          <button className="h-12 rounded-xl border border-[#0658C2] px-8 text-base font-semibold text-[#0658C2]">
            Save as Draft
          </button>
          <button className="h-12 rounded-xl bg-[#0658C2] px-8 text-base font-semibold text-white">
            Submit Profile
          </button>
        </div>
      </div>
    </section>
  );
}

function PageTitle({ title, crumb, onBack }: { title: string; crumb: string; onBack: () => void }) {
  return (
    <div className="flex items-start gap-1">
      <button onClick={onBack} className="group rounded-full p-1 cursor-pointer hover:bg-[#DBEAFF]" aria-label="Back">
        <ChevronLeft className="group-hover:text-[#0658C2] h-7 w-7" />
      </button>
      <div>
        <h1 className="text-2xl font-bold tracking-normal">{title}</h1>
        <p className="mt-1 text-sm text-[#676767]">{crumb}</p>
      </div>
    </div>
  );
}

function InfoCard({ title, icon: Icon, rows }: { title: string; icon: typeof User; rows: string[][] }) {
  const [editing, setEditing] = useState(false);
  const [draftRows, setDraftRows] = useState(rows);

  return (
    <div className="h-full rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
      <div className="mb-[16px] flex items-center justify-between">
        <SectionHeading icon={Icon} title={title} />
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="inline-flex items-center gap-1 text-sm text-[#0658C2] cursor-pointer"
        >
          <Edit3 className="h-4 w-4" /> {editing ? 'Save' : 'Edit'}
        </button>
      </div>
      <div className="space-y-0">
        {draftRows.map(([label, value], index) => (
          <div key={label} className="grid grid-cols-[45%_1fr] gap-4 border-b border-[#D3D3D3] py-3 text-sm">
            <span className="text-[#676767]">{label}</span>
            {editing ? (
              <input
                value={value}
                onChange={(event) =>
                  setDraftRows((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index ? [item[0] ?? '', event.target.value] : item,
                    ),
                  )
                }
                className="h-9 rounded-md border border-[#D3D3D3] px-3 font-semibold outline-none focus:border-[#0658C2]"
              />
            ) : (
              <span className="font-semibold">{value || '-'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormPanel({
  title,
  icon: Icon,
  children,
  columns = 'three',
}: {
  title: string;
  icon: typeof User;
  children: React.ReactNode;
  columns?: 'single' | 'three';
}) {
  return (
    <section className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
      <SectionHeading icon={Icon} title={title} />
      <div className={`mt-4 grid gap-4 ${columns >= 'three' ? 'md:grid-cols-2 2xl:grid-cols-3' : ''}`}>{children}</div>
    </section>
  );
}

function Field({
  label,
  placeholder,
  required,
  icon: Icon,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  icon?: typeof User;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>
      <span className="relative block">
        <input
          className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 pr-11 text-sm outline-none focus:border-[#0658C2]"
          placeholder={placeholder}
        />
        {Icon && <Icon className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />}
      </span>
    </label>
  );
}

function SelectField({
  label,
  placeholder,
  required,
  options,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  options: string[];
}) {
  const { openDropdown, setOpenDropdown } = useEmployeeStore();
  const dropdownId = `select-${label}`;
  const open = openDropdown === dropdownId;
  const [value, setValue] = useState('');

  return (
    <label className="relative block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>
      <button
        type="button"
        onClick={() => setOpenDropdown(open ? null : dropdownId)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-100 px-4 text-left text-sm text-[#676767] focus:border-[#0658C2] cursor-pointer"
      >
        {value || placeholder}
        <ChevronDown className="h-5 w-5 text-black" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-[#DBEAFF] bg-white p-2 shadow-xl max-h-[260px] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setValue(option);
                setOpenDropdown(null);
              }}
              className={`group flex w-full items-center mb-1 justify-between rounded-md cursor-pointer border border-gray-100 px-[16px] py-[9px] text-[14px]text-left hover:bg-[#DBEAFF] hover:border-transparent text-sm ${
                value === option ? 'bg-[#DBEAFF] text-[#0658C2]' : 'hover:bg-[#DBEAFF]'
              }`}
            >
              {option}
              <span className={`h-4 w-4 rounded border text-[#0658C2] group-hover:bg-white group-hover:border-transparent ${value === option ? 'border-transparent bg-white' : 'border-[#D3D3D3]'}`}>
                {value === option && (
                  <span className="relative block h-4 w-4 rounded">
                    <span className="absolute inset-0 bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] top-[-6px] left-[2px] bg-center bg-no-repeat" />
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function RadioGroup({
  label,
  options,
  value,
  required,
}: {
  label: string;
  options: string[];
  value: string;
  required?: boolean;
}) {
  const [selected, setSelected] = useState(value);

  return (
    <div>
      <p className="mb-4 text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </p>
      <div className="flex flex-wrap gap-6">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => setSelected(option)} className="inline-flex items-center gap-2 cursor-pointer">
          <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected === option ? "border-[#0658C2] ring-4 ring-blue-100" : "border-gray-300"}`}>
            {selected === option && (
              <span className="h-2 w-2 rounded-full bg-blue-600" />
            )}
          </span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function PaymentOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center gap-3 rounded-lg border border-[#D3D3D3] px-4 text-left font-medium cursor-pointer"
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${active ? "border-[#0658C2] ring-4 ring-blue-100" : "border-gray-300"}`}>
        {active && (
          <span className="h-2 w-2 rounded-full bg-blue-600" />
        )}
      </span>
      {label}
    </button>
  );
}

// function UploadBox({ label, required }: { label: string; required?: boolean }) {
//   return (
//     <label className="block">
//       <span className="mb-2 block text-sm font-semibold">
//         {label} {required && <span className="text-[#F54A4A]">*</span>}
//       </span>
//       <div className="flex h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-[#D3D3D3] bg-[#F9FAFF] text-center">
//         <UploadCloud className="mb-2 h-7 w-7 text-[#0658C2]" />
//         <p className="text-sm text-[#676767]">Click to upload or drag and drop</p>
//         <p className="text-xs text-[#676767]">PDF, JPG, PNG (Max, 5MB each)</p>
//       </div>
//     </label>
//   );
// }

// function UploadModal({ onClose }: { onClose: () => void }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
//       <div className="w-full max-w-[680px] rounded-xl bg-white p-6 shadow-2xl">
//         <div className="flex items-center justify-between">
//           <SectionHeading icon={FileText} title="Upload Document" />
//           <button onClick={onClose} aria-label="Close">
//             <X className="h-6 w-6" />
//           </button>
//         </div>
//         <div className="mt-8 flex h-[155px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-[#FAFAFA] text-center">
//           <UploadCloud className="mb-2 h-7 w-7 text-[#0658C2]" />
//           <p className="text-sm text-[#676767]">Click to upload or drag and drop</p>
//           <p className="text-xs text-[#676767]">PDF, JPG, PNG (Max, 5MB each)</p>
//         </div>
//         <div className="mt-5 flex items-center gap-4 rounded-xl border border-[#D3D3D3] p-3 shadow-sm">
//           <div className="h-10 w-16 rounded bg-orange-50 ring-1 ring-orange-200" />
//           <div className="flex-1">
//             <p className="text-sm font-semibold">Aadhaar_Card_Ramesh_Yadav.jpg</p>
//             <p className="text-xs text-[#676767]">1.24 MB</p>
//           </div>
//           <Check className="h-5 w-5 rounded-full bg-[#E5FFEB] p-1 text-[#4CAF50]" />
//           <Trash2 className="h-5 w-5 text-[#0658C2]" />
//         </div>
//         <h3 className="mt-6 text-base font-semibold">Document Preview</h3>
//         <div className="mx-auto mt-5 h-[220px] max-w-[350px] rounded bg-white p-5 text-center shadow-sm ring-1 ring-gray-100">
//           <div className="mx-auto mb-3 h-10 w-28 rounded bg-[#E5FFEB]" />
//           <div className="grid grid-cols-[80px_1fr] gap-4 text-left text-xs">
//             <div className="h-24 rounded bg-gray-200" />
//             <div>
//               <p className="font-semibold">Ramesh Yadav</p>
//               <p>01/01/1990</p>
//               <p>Male</p>
//               <div className="mt-3 h-20 w-20 bg-[linear-gradient(45deg,#111_25%,transparent_25%),linear-gradient(-45deg,#111_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#111_75%),linear-gradient(-45deg,transparent_75%,#111_75%)] bg-[length:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0px]" />
//             </div>
//           </div>
//           <p className="mt-4 border-t border-red-300 pt-2 font-semibold">1234 5678 9012</p>
//         </div>
//         <div className="mt-6 flex justify-end gap-4">
//           <button onClick={onClose} className="h-14 rounded-xl border border-[#0658C2] px-8 font-semibold text-[#0658C2]">
//             Cancel
//           </button>
//           <button onClick={onClose} className="h-14 rounded-xl bg-blue-600 px-8 font-semibold text-white">
//             Upload Document
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
type UploadBoxProps = {
  label?: string;
  required?: boolean;
  onFileSelect?: (file: File) => void;
};

function UploadBox({
  label,
  required,
  onFileSelect,
}: UploadBoxProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    onFileSelect?.(file);
  };

  return (
    <label className="block cursor-pointer">
      {label && (
        <span className="mb-2 block text-sm font-semibold">
          {label}
          {required && (
            <span className="text-[#F54A4A]"> *</span>
          )}
        </span>
      )}

      <div className="flex h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-[#D3D3D3] bg-[#F9FAFF] text-center">
        <UploadCloud className="mb-2 h-7 w-7 text-[#0658C2]" />

        <p className="text-sm text-[#676767]">
          Click to upload or drag and drop
        </p>

        <p className="text-xs text-[#676767]">
          PDF, JPG, PNG (Max 5MB)
        </p>
      </div>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
}

function UploadModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      setPreviewUrl(
        URL.createObjectURL(selectedFile)
      );
    } else {
      setPreviewUrl("");
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-[680px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="overflow-y-auto p-[20px]">
          <div className="flex items-center justify-between pb-[20px]">
            <SectionHeading icon={FileText} title="Upload Document"/>

            <button onClick={onClose} aria-label="Close">
              <X className="h-6 w-6 cursor-pointer" />
            </button>
          </div>
          <div className="max-h-[450px] 2xl:max-h-full overflow-y-auto">

          <div>
            <UploadBox onFileSelect={handleFileSelect} />
          </div>

          {file && (
            <>
              <div className="mt-[16px] flex items-center gap-4 rounded-xl border border-[#D3D3D3] p-3 shadow-sm">
                <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded bg-orange-50 ring-1 ring-orange-200">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Document" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-5 w-5 text-[#FFA000]" />
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold">{file.name}</p>

                  <p className="text-xs text-[#676767]">
                    {(file.size / 1024 / 1024).toFixed(2)}
                    MB
                  </p>
                </div>

                <Check className="h-5 w-5 rounded-full bg-[#E5FFEB] p-1 text-[#4CAF50]" />

                <button onClick={removeFile}>
                  <Trash2 className="h-5 w-5 text-[#F54A4A] cursor-pointer" />
                </button>
              </div>

              <h3 className="mt-[16px] text-base font-semibold">Document Preview</h3>

              <div className="mt-4 max-h-[250px] md:max-h-[450px] xl:max-h-[550px] 2xl:max-h-[650px] overflow-auto rounded-xl border border-[#D3D3D3] bg-[#FAFAFA] p-4">
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#676767]">
                    PDF Preview Area
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-[16px] flex justify-end gap-4">
            <button
              onClick={onClose}
              className="h-12 rounded-xl border border-[#0658C2] px-8 font-semibold text-[#0658C2] cursor-pointer"
            >
              Cancel
            </button>

            <button
              disabled={!file}
              className="h-12 rounded-xl bg-[#0658C2] px-8 font-semibold text-white disabled:opacity-50 cursor-pointer"
            >
              Upload Document
            </button>
          </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[20px] font-semibold">
      <Icon className="h-5 w-5 text-[#0658C2]" />
      {title}
    </h2>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-semibold ${statusStyle[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function Avatar({ name, size }: { name: string; size: 'sm' | 'md' | 'xl' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-xs',
    xl: 'h-28 w-28 text-2xl',
  };

  return (
    <div className={`${sizes[size]} shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 via-emerald-100 to-amber-100 ring-1 ring-gray-200`}>
      <div className="flex h-full w-full items-center justify-center font-bold text-blue-800">
        {name
          .split(' ')
          .map((item) => item[0])
          .join('')
          .slice(0, 2)}
      </div>
    </div>
  );
}

function IconLine({ icon: Icon, text }: { icon: typeof User; text: string }) {
  return (
    <p className="flex items-center gap-4">
      <Icon className="h-5 w-5 text-[#676767]" />
      {text}
    </p>
  );
}

function EditableIconLine({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <Icon className="h-5 w-5 text-[#676767]" />
      {children}
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  editable,
  onChange,
}: {
  icon: typeof User;
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFF]">
        <Icon className="h-5 w-5 text-[#0658C2]" />
      </span>
      <div>
        <p className="text-sm text-[#676767]">{label}</p>
        {editable ? (
          <input
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className="h-8 rounded-md border border-[#D3D3D3] px-2 text-sm font-semibold outline-none focus:border-[#0658C2]"
          />
        ) : (
          <p className="text-sm font-semibold">{value}</p>
        )}
      </div>
    </div>
  );
}

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.min(Math.max(1, currentPage), Math.max(1, totalPages - 3));
  return [start, start + 1, start + 2, '...', totalPages].filter(
    (page, index, pages) => page !== pages[index - 1],
  );
};

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAFAFA] disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      {getVisiblePages(currentPage, totalPages).map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-[#676767]">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page as number)}
            className={`h-8 min-w-8 rounded-lg px-2 ${
              page === currentPage ? 'bg-gray-100 font-semibold text-blue-700' : ''
            }`}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAFAFA] disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#D3D3D3] shadow-sm">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="bg-[#FAFAFA] text-[#676767]">
            {headers.map((head) => (
              <th key={head} className="px-5 py-[10px]">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[#D3D3D3] text-[#676767]">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-5 py-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollapsibleTitle({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-[#D3D3D3] px-5 py-[9px] text-left shadow-sm mb-2"
    >
      <h3 className="text-[20px] font-semibold text-[#676767]">{title}</h3>
      {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </button>
  );
}

function LeaveBalanceCard({
  title,
  value,
  note,
  color,
}: {
  title: string;
  value: string;
  note: string;
  color: 'green' | 'violet' | 'orange';
}) {
  const colorMap = {
    green: 'bg-[#E5FFEB] text-[#4CAF50]',
    violet: 'bg-[#EDE9FE] text-[#8B5CF6]',
    orange: 'bg-[#FFF4E3] text-[#FFA000]',
  };

  return (
    <div className={`rounded-2xl p-5 text-center ${colorMap[color]}`}>
      <p className="min-h-10 text-sm text-[#676767]">{title}</p>
      <p className="mt-2 text-3xl font-medium">{value}</p>
      <p className="text-xs text-[#676767]">Days</p>
      <p className="mt-4 text-xs text-[#676767]">{note}</p>
    </div>
  );
}

function legendColor(code: string) {
  if (code === 'P') return 'text-[#4CAF50]';
  if (code === 'A') return 'text-[#F54A4A]';
  if (code === 'L') return 'text-[#8B5CF6]';
  if (code === 'H') return 'text-[#0658C2]';
  return 'text-[#676767]';
}

function legendChip(code: string) {
  if (code === 'P') return 'bg-[#E5FFEB] text-[#4CAF50]';
  if (code === 'A') return 'bg-[#FEE9E5] text-[#F54A4A]';
  if (code === 'L') return 'bg-[#EDE9FE] text-[#8B5CF6]';
  if (code === 'H') return 'bg-[#DBEAFF] text-[#0658C2]';
  return 'bg-[#F4F4F4] text-[#676767]';
}
