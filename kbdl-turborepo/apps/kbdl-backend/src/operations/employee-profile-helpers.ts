import { HrAddressType, MaritalStatus, Prisma } from '@repo/db/server';

export type AddressInput = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

export type AddressesInput = {
  present?: AddressInput;
  permanent?: AddressInput;
};

export function formatAddressLine(entry?: {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
} | null): string {
  if (!entry) return '';
  const parts = [
    entry.line1,
    entry.line2,
    [entry.city, entry.state].filter(Boolean).join(', '),
    entry.pincode ? `- ${entry.pincode}` : null,
  ].filter((part) => part && String(part).trim());
  return parts.join(', ').trim();
}

export function legacyAddressFromPresent(present?: AddressInput): string | null {
  if (!present?.line1?.trim()) return null;
  return formatAddressLine(present) || present.line1.trim();
}

export async function upsertHrAddresses(
  tx: Prisma.TransactionClient,
  hrProfileId: string,
  addresses?: AddressesInput,
): Promise<void> {
  if (!addresses) return;

  const upsertOne = async (type: HrAddressType, input?: AddressInput) => {
    if (!input?.line1?.trim()) return;
    await tx.employeeHrAddress.upsert({
      where: {
        hr_profile_id_type: {
          hr_profile_id: hrProfileId,
          type,
        },
      },
      create: {
        hr_profile_id: hrProfileId,
        type,
        line1: input.line1.trim(),
        line2: input.line2?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        pincode: input.pincode?.trim() || null,
        country: (input.country || 'IN').toUpperCase(),
      },
      update: {
        line1: input.line1.trim(),
        line2: input.line2?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        pincode: input.pincode?.trim() || null,
        country: (input.country || 'IN').toUpperCase(),
      },
    });
  };

  await upsertOne(HrAddressType.present, addresses.present);
  await upsertOne(HrAddressType.permanent, addresses.permanent);
}

export function mapPersonalExtras(personal?: {
  alternate_phone?: string;
  marital_status?: string;
  father_name?: string;
  mother_name?: string;
  nationality?: string;
  religion?: string;
  languages_known?: string;
  employment_terms?: {
    probation_period_months?: number;
    notice_period_days?: number;
    weekly_off?: string;
    confirmation_date?: string;
    working_hours?: string;
  };
}) {
  if (!personal) return {};

  const terms = personal.employment_terms;

  return {
    alternate_phone: personal.alternate_phone ?? undefined,
    marital_status: personal.marital_status as MaritalStatus | undefined,
    father_name: personal.father_name?.trim() || undefined,
    mother_name: personal.mother_name?.trim() || undefined,
    nationality: personal.nationality?.trim() || undefined,
    religion: personal.religion?.trim() || undefined,
    languages_known: personal.languages_known?.trim() || undefined,
    probation_period_months: terms?.probation_period_months ?? undefined,
    notice_period_days: terms?.notice_period_days ?? undefined,
    weekly_off: terms?.weekly_off?.trim() || undefined,
    confirmation_date: terms?.confirmation_date
      ? new Date(`${terms.confirmation_date}T00:00:00.000Z`)
      : undefined,
    working_hours: terms?.working_hours?.trim() || undefined,
  };
}

export function mapIdentityExtras(identity?: {
  voter_id?: string;
  uan_number?: string;
  esi_number?: string;
  pf_number?: string;
}) {
  if (!identity) return {};
  return {
    voter_id: identity.voter_id?.trim() || undefined,
    uan_number: identity.uan_number?.trim() || undefined,
    esi_number: identity.esi_number?.trim() || undefined,
    pf_number: identity.pf_number?.trim() || undefined,
  };
}
