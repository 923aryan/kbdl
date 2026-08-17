import { OnboardingStage, SeparationReason } from '@repo/db/server';

/**
 * Status mapping (single source of truth)
 *
 * - `is_active`           → roster filter: current vs past employees
 * - `separation_reason`   → detail when inactive: terminated | resigned | absconded | inactive
 * - `OnboardingStage`     → HR onboard flow: draft | onboard | probation
 * - `ui_status`           → employer UI labels on /employees
 */

export type EmployerUiStatus =
  | 'Onboard'
  | 'Probation'
  | 'Active'
  | 'Inactive'
  | 'On Leave'
  | 'Absent'
  | 'On Boarding';

export function mapOnboardingStageToUi(stage: OnboardingStage | null | undefined): EmployerUiStatus {
  switch (stage) {
    case OnboardingStage.draft:
      return 'On Boarding';
    case OnboardingStage.probation:
      return 'Probation';
    case OnboardingStage.onboard:
    default:
      return 'Onboard';
  }
}

export function mapEmploymentStatusToUi(
  isActive: boolean,
  onboardingStage?: OnboardingStage | null,
): EmployerUiStatus {
  if (!isActive) return 'Inactive';
  return mapOnboardingStageToUi(onboardingStage);
}

export function formatSeparationReason(
  reason: SeparationReason | null | undefined,
): string | null {
  if (!reason) return null;
  return reason.charAt(0).toUpperCase() + reason.slice(1);
}

export function resolveOnboardingStageFromDocs(args: {
  action: 'draft' | 'submit';
  hasFullIdentityDocs: boolean;
}): OnboardingStage {
  if (args.action === 'draft') return OnboardingStage.draft;
  return args.hasFullIdentityDocs ? OnboardingStage.probation : OnboardingStage.onboard;
}

/** Membership check — single source of truth for "is employee in this company?" */
export const ACTIVE_EMPLOYMENT_FILTER = { is_active: true } as const;
