export type RealtimeNotificationType =
  | 'shift_swap_request'
  | 'public_shift'
  | 'job_alert'
  | 'onboard_request';

export interface RealtimeNotification {
  id: string;

  type: RealtimeNotificationType;

  title: string;

  body: string;

  data: Record<string, any>;

  isRead: boolean;

  createdAt: string;
}
