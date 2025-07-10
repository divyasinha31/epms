enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE = 'task_due',
  TASK_OVERDUE = 'task_overdue',
  TASK_COMPLETED = 'task_completed',
  PROJECT_ASSIGNED = 'project_assigned',
  PROJECT_UPDATED = 'project_updated',
  USER_MENTIONED = 'user_mentioned',
  DEADLINE_REMINDER = 'deadline_reminder',
  SYSTEM = 'system'
}

enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  createdAt: Date;
  readAt?: Date;
}

interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskAssignments: boolean;
  dueDateReminders: boolean;
  projectUpdates: boolean;
  mentions: boolean;
  digestFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
}

interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  dateFrom?: Date;
  dateTo?: Date;
}

interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export {
  NotificationType,
  NotificationPriority,
  Notification,
  NotificationPreferences,
  CreateNotificationRequest,
  NotificationFilters,
  PaginatedNotifications
};
