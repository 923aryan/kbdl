import { safeUserSelect } from '@repo/db/server';
import type { UserDTO } from '@repo/types';

export const workforcePersonInclude = {
  linked_user: { select: safeUserSelect },
} as const;

/** App-facing employee view — linked User when present, else HR identity snapshot. */
export function buildEmployeeView(row: {
  workforce_person: {
    id: string;
    phone_no: string;
    karigari_id: string | null;
    linked_user_id: string | null;
    linked_user?: UserDTO | null;
  };
  hr_profile?: { full_name?: string | null; email?: string | null } | null;
}): UserDTO {
  if (row.workforce_person.linked_user) {
    return row.workforce_person.linked_user;
  }

  return {
    id: row.workforce_person.id,
    name: row.hr_profile?.full_name ?? null,
    phone_no: row.workforce_person.phone_no,
    city: null,
    area: null,
    skills: [],
    rating_avg: null,
    rating_count: null,
    verification_level: null,
    extra_shift: true,
    created_at: new Date(),
    preferences: {},
  } as UserDTO;
}
