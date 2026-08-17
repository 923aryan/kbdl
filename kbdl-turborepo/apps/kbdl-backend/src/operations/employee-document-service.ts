import { prisma } from '@repo/db/server';
import type { AddEmployeeDocumentPayload, EmployeeEmploymentDTO } from '@repo/types';
import { AppError } from '../utils/api-error';
import { getEmployeeDetailsService } from './operation-services';

const CORE_IDENTITY_DOC_TYPES = new Set(['Aadhaar Card', 'PAN Card', 'Driving License']);
const ADDITIONAL_DOC_TYPE = 'Additional Documents';

export async function addEmployeeDocumentService(
  employerId: string,
  employmentId: string,
  payload: AddEmployeeDocumentPayload,
): Promise<EmployeeEmploymentDTO> {
  const employment = await prisma.employeeEmployment.findFirst({
    where: {
      id: employmentId,
      company_id: employerId,
      is_active: true,
    },
    include: {
      hr_profile: { select: { id: true } },
    },
  });

  if (!employment?.hr_profile) {
    throw new AppError(
      404,
      'EMPLOYEE_NOT_FOUND',
      'Active employee record not found or access denied',
    );
  }

  const { document_type, document_number, file_key, file_name, expiry_date } = payload;
  const hrProfileId = employment.hr_profile.id;

  if (CORE_IDENTITY_DOC_TYPES.has(document_type)) {
    await prisma.employeeHrProfile.update({
      where: { id: hrProfileId },
      data: { identity_document_url: file_key },
    });
    return getEmployeeDetailsService(employerId, employmentId);
  }

  if (document_type === ADDITIONAL_DOC_TYPE) {
    await prisma.employeeHrProfile.update({
      where: { id: hrProfileId },
      data: { additional_document_url: file_key },
    });
    return getEmployeeDetailsService(employerId, employmentId);
  }

  await prisma.employeeHrDocument.create({
    data: {
      hr_profile_id: hrProfileId,
      document_type,
      document_number: document_number ?? null,
      file_key,
      file_name: file_name ?? null,
      expiry_date: expiry_date ? new Date(`${expiry_date}T00:00:00.000Z`) : null,
    },
  });

  return getEmployeeDetailsService(employerId, employmentId);
}
