import {
  CreateLeadRequest,
  DeleteLeadRequest,
  GetLeadByIdRequest,
  ResolveLeadRequest,
} from "@repo/types";

import {
  createLeadSchema,
  deleteLeadSchema,
  getLeadByIdSchema,
  resolveLeadSchema,
} from "@repo/validator/shared";

import { Request, Response } from "express";

import { sendSuccess } from "../utils/send-success";
import { validate } from "../utils/validate";

import {
  createLeadService,
  deleteLeadService,
  getAllLeadsService,
  getLeadByIdService,
  resolveLeadService,
} from "./leads-services";

// A. Create Lead (Public)
const createLead = async (req: Request, res: Response) => {
  const input: CreateLeadRequest = validate(createLeadSchema, req);

  const lead = await createLeadService(input.body);

  sendSuccess(res, "Lead created successfully", lead, 201);
};

// B. Get All Leads (Admin)
const getAllLeads = async (_req: Request, res: Response) => {
  const leads = await getAllLeadsService();

  sendSuccess(res, "Leads retrieved successfully", leads, 200);
};

// C. Get Lead By ID (Admin)
const getLeadById = async (req: Request, res: Response) => {
  const input: GetLeadByIdRequest = validate(getLeadByIdSchema, req);

  const lead = await getLeadByIdService(input.params.id);

  sendSuccess(res, "Lead retrieved successfully", lead, 200);
};

// D. Resolve Lead (Admin)
const resolveLead = async (req: Request, res: Response) => {
  const input: ResolveLeadRequest = validate(resolveLeadSchema, req);

  const lead = await resolveLeadService(input.params.id);

  sendSuccess(res, "Lead resolved successfully", lead, 200);
};

// E. Delete Lead (Admin)
const deleteLead = async (req: Request, res: Response) => {
  const input: DeleteLeadRequest = validate(deleteLeadSchema, req);

  const lead = await deleteLeadService(input.params.id);

  sendSuccess(res, "Lead deleted successfully", lead, 200);
};

export {
  createLead,
  deleteLead,
  getAllLeads,
  getLeadById,
  resolveLead
};
