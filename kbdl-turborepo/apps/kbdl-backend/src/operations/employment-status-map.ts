import { EmploymentStatus, OnboardingStage } from '@repo/db/server';

/**
 * Status mapping (single source of truth)
 *
 * - `EmploymentStatus`  → roster lifecycle: pending | active | inactive | terminated | resigned
 * - `OnboardingStage`   → HR onboard flow: draft | onboard | probation
 * - `ui_status`         → employer UI labels on /employees
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
  employmentStatus: EmploymentStatus,
  onboardingStage?: OnboardingStage | null,
): EmployerUiStatus {
  if (employmentStatus === EmploymentStatus.inactive) return 'Inactive';
  if (employmentStatus === EmploymentStatus.terminated) return 'Inactive';
  if (employmentStatus === EmploymentStatus.resigned) return 'Inactive';

  // pending / active: prefer HR onboarding stage for list badge
  if (
    employmentStatus === EmploymentStatus.pending ||
    employmentStatus === EmploymentStatus.active
  ) {
    return mapOnboardingStageToUi(onboardingStage);
  }

  return 'Onboard';
}

export function resolveOnboardingStageFromDocs(args: {
  action: 'draft' | 'submit';
  hasFullIdentityDocs: boolean;
}): OnboardingStage {
  if (args.action === 'draft') return OnboardingStage.draft;
  return args.hasFullIdentityDocs ? OnboardingStage.probation : OnboardingStage.onboard;
}
