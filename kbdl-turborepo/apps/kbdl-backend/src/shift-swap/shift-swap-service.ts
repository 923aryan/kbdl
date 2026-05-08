import { prisma, Rating, Shift } from "@repo/db/server";
import { AcceptShiftPayload, CreateShiftPayload, GetExtraShiftsQuery, RateShiftPayload, UpdateShiftPayload } from "@repo/types";
import { AppError } from "../utils/api-error";
// A. Create Shift Swap
export const createShiftService = async (
  userId: string,
  userType: "user" | "organization",
  payload: CreateShiftPayload
): Promise<Shift> => {
  let employerId = payload.employer_id;
  let originalEmployeeId = payload.original_employee_id;

  // 1. If created by an employee (user)
  if (userType === "user") {
    originalEmployeeId = userId; // Enforce that the user is the original employee

    // Validate that the user is actually employed by the specified employer
    const employment = await prisma.employeeEmployment.findFirst({
      where: {
        employee_id: userId,
        employer_id: employerId,
        employment_status: "active",
      },
    });

    if (!employment) {
      throw new AppError(403, "NOT_EMPLOYED", "You are not an active employee of this organization.");
    }
  }
  // 2. If created by the organization (employer)
  else if (userType === "organization") {
    employerId = userId; // Enforce that the creator is the employer

    if (!originalEmployeeId) {
      throw new AppError(400, "MISSING_EMPLOYEE", "Employer must specify the original employee ID for the shift swap.");
    }

    // Validate that the specified employee works for this employer
    const employment = await prisma.employeeEmployment.findFirst({
      where: {
        employee_id: originalEmployeeId,
        employer_id: employerId,
        employment_status: "active",
      },
    });

    if (!employment) {
      throw new AppError(403, "INVALID_EMPLOYEE", "This user is not an active employee of your organization.");
    }
  }

  if (!employerId) {
    throw new AppError(
      400,
      "MISSING_EMPLOYER",
      "Employer ID is required."
    );
  }

  if (!originalEmployeeId) {
    throw new AppError(
      400,
      "MISSING_EMPLOYEE",
      "Original employee ID is required."
    );
  }


  // 3. Create the shift
  const newShift = await prisma.shift.create({
    data: {
      original_employee_id: originalEmployeeId,
      employer_id: employerId,
      replacement_employee_id: payload.replacement_employee_id || null, // Null implies a public shift
      created_by: userType,
      shift_date: new Date(payload.shift_date),
      shift_start: new Date(payload.shift_start),
      shift_end: new Date(payload.shift_end),
      skill_required: payload.skill_required,
      status: "open",
      request_accepted: false,
      organization_approved: userType === "organization", // Auto-approve if created by org
    },
  });

  return newShift;
};

// A. Accept Shift Swap
export const acceptShiftService = async (
  workerId: string,
  payload: AcceptShiftPayload
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: payload.shift_id },
  });

  if (!shift) {
    throw new AppError(404, "SHIFT_NOT_FOUND", "Shift not found.");
  }

  if (shift.status !== "open") {
    throw new AppError(400, "SHIFT_NOT_OPEN", "This shift is no longer open for acceptance.");
  }

  if (shift.original_employee_id === workerId) {
    throw new AppError(400, "SELF_ACCEPT_ERROR", "You cannot accept your own shift swap request.");
  }

  // If replacement_employee_id is already set, it's a direct request. Ensure the accepting worker is the requested one.
  if (shift.replacement_employee_id && shift.replacement_employee_id !== workerId) {
    throw new AppError(403, "NOT_REQUESTED", "This shift swap was requested for a specific employee.");
  }

  // Accept the shift
  const updatedShift = await prisma.shift.update({
    where: { id: payload.shift_id },
    data: {
      replacement_employee_id: workerId,
      request_accepted: true,
      status: "matched", // Update status to reflect it has been accepted
    },
  });

  return updatedShift;
};

// B1. See Accepted Shifts (Worker)
export const getEmployeeShiftsService = async (
  employeeId: string
): Promise<Shift[]> => {
  const shifts = await prisma.shift.findMany({
    where: {
      replacement_employee_id: employeeId,
      request_accepted: true,
      status: {
        in: ["matched", "approved"], // Fetching scheduled/accepted shifts
      },
    },
    include: {
      employer: {
        select: { company_name: true, company_address: true },
      },
      original_employee: {
        select: { name: true, phone_no: true },
      },
    },
    orderBy: {
      shift_start: "asc",
    },
  });

  return shifts;
};

// B2. See Created Shifts (Employer)
export const getEmployerShiftsService = async (
  employerId: string
): Promise<Shift[]> => {
  const shifts = await prisma.shift.findMany({
    where: {
      employer_id: employerId,
    },
    include: {
      original_employee: {
        select: { name: true, phone_no: true, skills: true },
      },
      replacement_employee: {
        select: { name: true, phone_no: true, skills: true },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return shifts;
};

export const cancelShiftService = async (
  userId: string,
  userType: "user" | "organization",
  shiftId: string
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });

  if (!shift) {
    throw new AppError(404, "SHIFT_NOT_FOUND", "Shift not found.");
  }

  if (shift.status === "completed" || shift.status === "cancelled") {
    throw new AppError(400, "INVALID_STATE", `Cannot cancel a shift that is already ${shift.status}.`);
  }

  // Authorization check
  if (userType === "user") {
    // A user can cancel if they are the one who requested it OR the one who accepted it
    if (shift.original_employee_id !== userId && shift.replacement_employee_id !== userId) {
      throw new AppError(403, "UNAUTHORIZED", "You do not have permission to cancel this shift.");
    }
  } else if (userType === "organization") {
    // An employer can cancel shifts under their organization
    if (shift.employer_id !== userId) {
      throw new AppError(403, "UNAUTHORIZED", "You do not have permission to cancel this shift.");
    }
  }

  const cancelledShift = await prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: "cancelled",
    },
  });

  return cancelledShift;
};

// B4. Update Shift (Only before acceptance)
export const updateShiftService = async (
  userId: string,
  userType: "user" | "organization",
  payload: UpdateShiftPayload
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: payload.shift_id },
  });

  if (!shift) {
    throw new AppError(404, "SHIFT_NOT_FOUND", "Shift not found.");
  }

  // Core Business Rule: Cannot update if already accepted
  if (shift.request_accepted || shift.status !== "open") {
    throw new AppError(400, "UPDATE_FORBIDDEN", "Cannot update a shift once it has been accepted or is no longer open.");
  }

  // Authorization check
  if (userType === "user" && shift.original_employee_id !== userId) {
    throw new AppError(403, "UNAUTHORIZED", "Only the creator can update this shift.");
  }
  if (userType === "organization" && shift.employer_id !== userId) {
    throw new AppError(403, "UNAUTHORIZED", "Only the employer who owns this shift can update it.");
  }

  const updatedShift = await prisma.shift.update({
    where: { id: payload.shift_id },
    data: {
      shift_date: payload.shift_date ? new Date(payload.shift_date) : undefined,
      shift_start: payload.shift_start ? new Date(payload.shift_start) : undefined,
      shift_end: payload.shift_end ? new Date(payload.shift_end) : undefined,
      skill_required: payload.skill_required,
      replacement_employee_id: payload.replacement_employee_id,
    },
  });

  return updatedShift;
};

// C. Get Extra Shifts (Public matching)
export const getExtraShiftsService = async (
  query: GetExtraShiftsQuery
): Promise<Shift[]> => {
  const { skill, date, limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  // Build dynamic where clause for public matching
  const whereClause: any = {
    status: "open",
    request_accepted: false,
    replacement_employee_id: null, // Ensures it's public, not directed at a specific user
  };

  if (skill) {
    whereClause.skill_required = {
      contains: skill,
      mode: "insensitive", // Postgres-specific ILIKE via Prisma
    };
  }

  if (date) {
    const targetDate = new Date(date);
    // Find shifts occurring on or after the queried date
    whereClause.shift_date = {
      gte: targetDate,
    };
  }

  const shifts = await prisma.shift.findMany({
    where: whereClause,
    include: {
      employer: {
        select: { company_name: true, company_address: true },
      },
    },
    skip,
    take: limit,
    orderBy: {
      shift_date: "asc",
    },
  });

  return shifts;
};

// D. Rate Employee/Employer
export const rateShiftService = async (
  raterId: string,
  raterType: "user" | "organization",
  payload: RateShiftPayload
): Promise<Rating> => {
  const shift = await prisma.shift.findUnique({
    where: { id: payload.shift_id },
  });

  if (!shift) {
    throw new AppError(404, "SHIFT_NOT_FOUND", "Shift not found.");
  }

  // Ensure rating happens only after a shift is completed or matched. 
  // Adjust this condition based on your exact domain rules.
  if (shift.status === "open" || shift.status === "cancelled") {
    throw new AppError(400, "INVALID_STATE", "Cannot rate a shift that is open or cancelled.");
  }

  // Construct rating payload depending on who is rating whom
  const ratingData: any = {
    shift_id: payload.shift_id,
    user_id: payload.user_id, // The ID of the employee receiving the rating
    score: payload.score,
    flagged_issue: payload.flagged_issue,
  };

  if (raterType === "organization") {
    ratingData.employer_id = raterId;
  } else {
    // If a user is rating another user (e.g., replacement rating the original, or vice versa)
    ratingData.user_employer_id = raterId;
  }

  const newRating = await prisma.rating.create({
    data: ratingData,
  });

  // Optional: Trigger a background job or update query here to recalculate the user's overall `rating_avg` in the User table

  return newRating;
};