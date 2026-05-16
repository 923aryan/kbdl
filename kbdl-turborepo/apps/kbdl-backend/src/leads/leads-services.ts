import { Lead, prisma } from '@repo/db/server';
import { CreateLeadPayload } from '@repo/types';

import { AppError } from '../utils/api-error';

// A. Create Lead
export const createLeadService = async (payload: CreateLeadPayload): Promise<Lead> => {
  const lead = await prisma.lead.create({
    data: {
      fullName: payload.fullName,
      email: payload.email.toLowerCase().trim(),
      mobileNumber: payload.mobileNumber.trim(),
      subject: payload.subject.trim(),
      message: payload.message.trim(),
    },
  });

  return lead;
};

// B. Get All Leads
export const getAllLeadsService = async (): Promise<Lead[]> => {
  const leads = await prisma.lead.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return leads;
};

// C. Get Lead By ID
export const getLeadByIdService = async (leadId: string): Promise<Lead> => {
  const lead = await prisma.lead.findUnique({
    where: {
      id: leadId,
    },
  });

  if (!lead) {
    throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead not found.');
  }

  return lead;
};

// D. Resolve Lead
export const resolveLeadService = async (leadId: string): Promise<Lead> => {
  const existingLead = await prisma.lead.findUnique({
    where: {
      id: leadId,
    },
  });

  if (!existingLead) {
    throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead not found.');
  }

  const updatedLead = await prisma.lead.update({
    where: {
      id: leadId,
    },
    data: {
      isResolved: true,
    },
  });

  return updatedLead;
};

// E. Delete Lead
export const deleteLeadService = async (leadId: string): Promise<Lead> => {
  const existingLead = await prisma.lead.findUnique({
    where: {
      id: leadId,
    },
  });

  if (!existingLead) {
    throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead not found.');
  }

  const deletedLead = await prisma.lead.delete({
    where: {
      id: leadId,
    },
  });

  return deletedLead;
};
