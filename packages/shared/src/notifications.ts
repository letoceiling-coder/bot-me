export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsSummaryDto {
  items: NotificationDto[];
  unreadCount: number;
}
