import { EmploymentStatus, prisma, safeEmployerSelect, safeUserSelect } from '@repo/db/server';
import {
  EmployeeEmploymentDTO,
  GetAllEmployeeEmploymentQuery,
  GetAllEmployeeEmploymentResponse,
  GetEmployeeEmploymentResponse,
  GetEmployeePendingEmploymentResponse,
  GetEmployeePendingEmploymentsQuery,
  GetEmployerRosterQuery,
  OnboardEmployeePayload,
  SearchAddressResponse,
  UpdateEmploymentStatusPayload,
} from '@repo/types';
import { GEOAPIFY_CONFIG } from '../config/geoapify';
import { createNotificationService } from '../notifications/notification-service';
import { AppError } from '../utils/api-error';
import { NotificationTypes } from '../utils/constants';

export const getEmployerRosterService = async (
  employerId: string,
  query: GetEmployerRosterQuery,
): Promise<{ roster: EmployeeEmploymentDTO[]; meta: Record<string, number> }> => {
  const { status, search, limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  // Build the dynamic filter clause
  const whereClause: any = {
    employer_id: employerId,
  };

  if (status) {
    whereClause.employment_status = status;
  }

  if (search) {
    // Allows searching by the worker's name, phone number, or karigari ID
    whereClause.employee = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone_no: { contains: search } },
        { karigari_id: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [roster, total] = await Promise.all([
    prisma.employeeEmployment.findMany({
      where: whereClause,
      include: {
        employee: { select: safeUserSelect },
      },
      orderBy: { joined_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.employeeEmployment.count({ where: whereClause }),
  ]);

  return {
    roster,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEmployeeDetailsService = async (
  employerId: string,
  mappingId: string,
): Promise<EmployeeEmploymentDTO> => {
  // Use findFirst to enforce the employerId security check
  // ensuring an employer cannot fetch another company's worker mapping
  const employeeDetails = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      employer_id: employerId,
    },
    include: {
      employee: { select: safeUserSelect },
    },
  });
  console.log('dd: ', employeeDetails);
  if (!employeeDetails) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee record not found or access denied');
  }
  return employeeDetails;
};

export const onboardEmployeeService = async (
  employerId: string,
  payload: OnboardEmployeePayload,
): Promise<EmployeeEmploymentDTO> => {
  const { phone_no, karigari_id, employee_no } = payload;

  // 1. Locate the User in the system using the provided identifiers
  const user = await prisma.user.findFirst({
    where: {
      OR: [...(phone_no ? [{ phone_no }] : []), ...(karigari_id ? [{ karigari_id }] : [])],
    },
  });

  if (!user) {
    throw new AppError(
      404,
      'WORKER_NOT_FOUND',
      'Worker not found with the provided credentials. They must register on Kaam Badlo first.',
    );
  }

  // 2. Prevent duplicate onboarding by checking the composite unique constraint
  const existingEmployment = await prisma.employeeEmployment.findUnique({
    where: {
      employer_id_employee_id: {
        employer_id: employerId,
        employee_id: user.id,
      },
    },
  });

  if (existingEmployment) {
    throw new AppError(
      409,
      'ALREADY_ONBOARDED',
      'This worker is already onboarded to your company roster.',
    );
  }

  // 3. Create the mapping row
  const employment = await prisma.employeeEmployment.create({
    data: {
      employer_id: employerId,
      employee_id: user.id,
      employee_no: employee_no || null,
      employment_status: EmploymentStatus.pending, // Default status on creation
      joined_at: new Date(),
    },
    include: {
      employee: true,
    },
  });

  //Modify this title and body for onboard request
  await createNotificationService({
    userId: user.id,
    type: NotificationTypes.onboardRequest,
    title: 'New onboard request',
    body: 'You received an onboard request',
    data: {
      type: NotificationTypes.onboardRequest,
      employmentId: employment.id,
      employerId,
    },
  });
  return employment;
};

export const updateEmploymentStatusService = async (
  employerId: string,
  mappingId: string,
  payload: UpdateEmploymentStatusPayload,
): Promise<EmployeeEmploymentDTO> => {
  const { status } = payload;

  // 1. Verify ownership before mutation
  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      employer_id: employerId,
    },
  });

  if (!existingRecord) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee record not found or access denied');
  }

  // 2. Logic: If the worker is leaving, automatically stamp the `left_at` date
  const isLeaving = status === EmploymentStatus.terminated || status === EmploymentStatus.resigned;

  // 3. Execute the update
  return prisma.employeeEmployment.update({
    where: {
      id: mappingId,
    },
    data: {
      employment_status: status,
      left_at: isLeaving ? new Date() : null, // Clears the date if they are moved back to 'active' or 'inactive'
    },
    include: {
      employee: true,
    },
  });
};

export const getAllEmployeeEmploymentService = async (
  employeeId: string,
  query: GetAllEmployeeEmploymentQuery,
): Promise<{ employments: GetAllEmployeeEmploymentResponse; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause = {
    employee_id: employeeId,
  };

  const [employments, total] = await Promise.all([
    prisma.employeeEmployment.findMany({
      where: whereClause,
      include: {
        employer: { select: safeEmployerSelect },
      },
      orderBy: { joined_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.employeeEmployment.count({ where: whereClause }),
  ]);

  return {
    employments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEmployeeEmploymentService = async (
  employeeId: string,
  mappingId: string,
): Promise<GetEmployeeEmploymentResponse> => {
  const employment = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      employee_id: employeeId,
    },
    include: {
      employer: { select: safeEmployerSelect },
    },
  });

  if (!employment) {
    throw new AppError(404, 'EMPLOYMENT_NOT_FOUND', 'Employment record not found or access denied');
  }

  return employment;
};

export const getEmployeePendingEmploymentsService = async (
  employeeId: string,
  query: GetEmployeePendingEmploymentsQuery,
): Promise<{ employments: GetEmployeePendingEmploymentResponse; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause = {
    employee_id: employeeId,
    employment_status: EmploymentStatus.pending,
  };

  const [employments, total] = await Promise.all([
    prisma.employeeEmployment.findMany({
      where: whereClause,
      include: {
        employer: { select: safeEmployerSelect },
      },
      orderBy: { joined_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.employeeEmployment.count({ where: whereClause }),
  ]);

  return {
    employments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const acceptEmploymentRequestService = async (
  employeeId: string,
  mappingId: string,
): Promise<GetEmployeeEmploymentResponse> => {
  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      employee_id: employeeId,
      employment_status: EmploymentStatus.pending,
    },
  });

  if (!existingRecord) {
    throw new AppError(
      404,
      'EMPLOYMENT_NOT_FOUND',
      'Employment request not found or already processed',
    );
  }

  // Mark any currently active employment for this employee as resigned
  await prisma.employeeEmployment.updateMany({
    where: {
      employee_id: employeeId,
      employment_status: EmploymentStatus.active,
    },
    data: {
      employment_status: EmploymentStatus.resigned,
      left_at: new Date(),
    },
  });

  const employment = await prisma.employeeEmployment.update({
    where: { id: mappingId },
    data: { employment_status: EmploymentStatus.active },
    include: { employer: { select: safeEmployerSelect } },
  });

  await prisma.user.update({
    where: { id: employeeId },
    data: { employer_id: employment.employer_id },
  });
  return employment;
};

export const declineEmploymentRequestService = async (employeeId: string, mappingId: string) => {
  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      employee_id: employeeId,
      employment_status: EmploymentStatus.pending,
    },
  });

  if (!existingRecord) {
    throw new AppError(
      404,
      'EMPLOYMENT_NOT_FOUND',
      'Employment request not found or already processed',
    );
  }

  return prisma.employeeEmployment.delete({
    where: { id: mappingId },
  });
};

export const getAddressSuggestionsService = async (
  query: string,
): Promise<SearchAddressResponse> => {
  const response = await fetch(
    `${GEOAPIFY_CONFIG.BASE_URL}/geocode/autocomplete?text=${encodeURIComponent(
      query,
    )}&filter=countrycode:in&limit=5&apiKey=${GEOAPIFY_CONFIG.API_KEY}`,
  );

  if (!response.ok) {
    throw new AppError(500, 'ADDRESS_LOOKUP_FAILED', 'Failed to retrieve address suggestions');
  }

  return response.json();
};
