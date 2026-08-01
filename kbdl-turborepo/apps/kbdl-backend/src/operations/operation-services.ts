import { EmploymentStatus, prisma, safeUserSelect } from '@repo/db/server';
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
import {
  companyAsEmployerInclude,
  mapEmploymentToApi,
} from '../compat/employer-compat';
import { GEOAPIFY_CONFIG } from '../config/geoapify';
import { createNotificationService } from '../notifications/notification-service';
import { AppError } from '../utils/api-error';
import { NotificationTypes } from '../utils/constants';

const withEmployerId = <T extends { company_id: string }>(row: T): T & { employer_id: string } => ({
  ...row,
  employer_id: row.company_id,
});

export const getEmployerRosterService = async (
  employerId: string,
  query: GetEmployerRosterQuery,
): Promise<{ roster: EmployeeEmploymentDTO[]; meta: Record<string, number> }> => {
  const { status, search, limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    company_id: employerId,
  };

  if (status) {
    whereClause.employment_status = status;
  }

  if (search) {
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
    roster: roster.map(withEmployerId) as EmployeeEmploymentDTO[],
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
  const employeeDetails = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      company_id: employerId,
    },
    include: {
      employee: { select: safeUserSelect },
    },
  });
  console.log('dd: ', employeeDetails);
  if (!employeeDetails) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee record not found or access denied');
  }
  return withEmployerId(employeeDetails) as EmployeeEmploymentDTO;
};

export const onboardEmployeeService = async (
  employerId: string,
  payload: OnboardEmployeePayload,
): Promise<EmployeeEmploymentDTO> => {
  const { phone_no, karigari_id, employee_no } = payload;

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

  const existingEmployment = await prisma.employeeEmployment.findUnique({
    where: {
      company_id_employee_id: {
        company_id: employerId,
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

  const employment = await prisma.employeeEmployment.create({
    data: {
      company_id: employerId,
      employee_id: user.id,
      employee_no: employee_no || null,
      employment_status: EmploymentStatus.pending,
      joined_at: new Date(),
    },
    include: {
      employee: true,
    },
  });

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
  return withEmployerId(employment) as EmployeeEmploymentDTO;
};

export const updateEmploymentStatusService = async (
  employerId: string,
  mappingId: string,
  payload: UpdateEmploymentStatusPayload,
): Promise<EmployeeEmploymentDTO> => {
  const { status } = payload;

  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      company_id: employerId,
    },
  });

  if (!existingRecord) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee record not found or access denied');
  }

  const isLeaving = status === EmploymentStatus.terminated || status === EmploymentStatus.resigned;

  const updated = await prisma.employeeEmployment.update({
    where: {
      id: mappingId,
    },
    data: {
      employment_status: status,
      left_at: isLeaving ? new Date() : null,
    },
    include: {
      employee: true,
    },
  });

  return withEmployerId(updated) as EmployeeEmploymentDTO;
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
        company: companyAsEmployerInclude,
      },
      orderBy: { joined_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.employeeEmployment.count({ where: whereClause }),
  ]);

  return {
    employments: employments.map((e) => mapEmploymentToApi(e as any)) as GetAllEmployeeEmploymentResponse,
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
      company: companyAsEmployerInclude,
    },
  });

  if (!employment) {
    throw new AppError(404, 'EMPLOYMENT_NOT_FOUND', 'Employment record not found or access denied');
  }

  return mapEmploymentToApi(employment as any) as GetEmployeeEmploymentResponse;
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
        company: companyAsEmployerInclude,
      },
      orderBy: { joined_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.employeeEmployment.count({ where: whereClause }),
  ]);

  return {
    employments: employments.map((e) => mapEmploymentToApi(e as any)) as GetEmployeePendingEmploymentResponse,
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
    include: { company: companyAsEmployerInclude },
  });

  // User.employer_id removed in schema refactor; active employment is source of truth.
  return mapEmploymentToApi(employment as any) as GetEmployeeEmploymentResponse;
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
