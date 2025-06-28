import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, interval } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../auth/services/auth.service';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  CreateNotificationRequest,
  NotificationFilters,
  PaginatedNotifications 
} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // Mock data storage
  private mockNotifications: Notification[] = [];
  private notificationIdCounter = 1;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.initializeMockData();
    this.startPeriodicNotificationCheck();
  }

  private initializeMockData(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.mockNotifications = [
      {
        id: '1',
        userId: currentUser.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: 'You have been assigned to "Setup Authentication System"',
        priority: NotificationPriority.HIGH,
        isRead: false,
        actionUrl: '/tasks',
        actionText: 'View Task',
        metadata: { taskId: '1', projectId: '1' },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: '2',
        userId: currentUser.id,
        type: NotificationType.TASK_DUE,
        title: 'Task Due Tomorrow',
        message: 'Task "Implement Project Management API" is due tomorrow',
        priority: NotificationPriority.MEDIUM,
        isRead: false,
        actionUrl: '/tasks',
        actionText: 'View Task',
        metadata: { taskId: '3', projectId: '1' },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: '3',
        userId: currentUser.id,
        type: NotificationType.PROJECT_UPDATED,
        title: 'Project Updated',
        message: 'Mobile App Redesign project has been updated',
        priority: NotificationPriority.LOW,
        isRead: true,
        actionUrl: '/projects/1',
        actionText: 'View Project',
        metadata: { projectId: '1' },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        readAt: new Date(Date.now() - 20 * 60 * 60 * 1000)
      },
      {
        id: '4',
        userId: currentUser.id,
        type: NotificationType.DEADLINE_REMINDER,
        title: 'Deadline Reminder',
        message: 'Project "Mobile App Redesign" deadline is in 5 days',
        priority: NotificationPriority.MEDIUM,
        isRead: false,
        actionUrl: '/projects/1',
        actionText: 'View Project',
        metadata: { projectId: '1' },
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      }
    ];

    this.updateNotificationState();
  }

  getNotifications(page: number = 1, limit: number = 20, filters?: NotificationFilters): Observable<PaginatedNotifications> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return of({
        notifications: [],
        total: 0,
        unreadCount: 0,
        page,
        limit
      });
    }

    let filteredNotifications = this.mockNotifications
      .filter(n => n.userId === currentUser.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply filters
    if (filters?.isRead !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isRead === filters.isRead);
    }

    if (filters?.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
    }

    if (filters?.priority) {
      filteredNotifications = filteredNotifications.filter(n => n.priority === filters.priority);
    }

    if (filters?.dateFrom) {
      filteredNotifications = filteredNotifications.filter(n => n.createdAt >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      filteredNotifications = filteredNotifications.filter(n => n.createdAt <= filters.dateTo!);
    }

    // Pagination
    const total = filteredNotifications.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const notifications = filteredNotifications.slice(startIndex, endIndex);

    const unreadCount = this.mockNotifications
      .filter(n => n.userId === currentUser.id && !n.isRead)
      .length;

    const result: PaginatedNotifications = {
      notifications,
      total,
      unreadCount,
      page,
      limit
    };

    return of(result);
    // Real API call would be:
    // return this.apiService.get<PaginatedNotifications>('/notifications', { page, limit, ...filters });
  }

  getUnreadCount(): Observable<number> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return of(0);

    const count = this.mockNotifications
      .filter(n => n.userId === currentUser.id && !n.isRead)
      .length;

    return of(count);
    // Real API call would be:
    // return this.apiService.get<number>('/notifications/unread-count');
  }

  markAsRead(notificationId: string): Observable<Notification> {
    const notification = this.mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      this.updateNotificationState();
    }

    return of(notification!);
    // Real API call would be:
    // return this.apiService.patch<Notification>(`/notifications/${notificationId}/read`, {});
  }

  markAsUnread(notificationId: string): Observable<Notification> {
    const notification = this.mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = false;
      notification.readAt = undefined;
      this.updateNotificationState();
    }

    return of(notification!);
    // Real API call would be:
    // return this.apiService.patch<Notification>(`/notifications/${notificationId}/unread`, {});
  }

  markAllAsRead(): Observable<void> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return of();

    this.mockNotifications
      .filter(n => n.userId === currentUser.id && !n.isRead)
      .forEach(n => {
        n.isRead = true;
        n.readAt = new Date();
      });

    this.updateNotificationState();
    return of();
    // Real API call would be:
    // return this.apiService.patch<void>('/notifications/mark-all-read', {});
  }

  deleteNotification(notificationId: string): Observable<void> {
    const index = this.mockNotifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      this.mockNotifications.splice(index, 1);
      this.updateNotificationState();
    }

    return of();
    // Real API call would be:
    // return this.apiService.delete<void>(`/notifications/${notificationId}`);
  }

  createNotification(request: CreateNotificationRequest): Observable<Notification> {
    const notification: Notification = {
      id: (++this.notificationIdCounter).toString(),
      userId: request.userId,
      type: request.type,
      title: request.title,
      message: request.message,
      priority: request.priority || NotificationPriority.MEDIUM,
      isRead: false,
      actionUrl: request.actionUrl,
      actionText: request.actionText,
      metadata: request.metadata,
      createdAt: new Date()
    };

    this.mockNotifications.unshift(notification);
    this.updateNotificationState();

    return of(notification);
    // Real API call would be:
    // return this.apiService.post<Notification>('/notifications', request);
  }

  // Simulate real-time notifications
  private startPeriodicNotificationCheck(): void {
    // Check for new notifications every 30 seconds
    interval(30000).subscribe(() => {
      this.simulateNewNotifications();
    });
  }

  private simulateNewNotifications(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    // Randomly create new notifications (10% chance)
    if (Math.random() < 0.1) {
      const notificationTypes = [
        {
          type: NotificationType.TASK_DUE,
          title: 'Task Due Soon',
          message: 'You have a task due in 2 hours',
          priority: NotificationPriority.HIGH
        },
        {
          type: NotificationType.PROJECT_UPDATED,
          title: 'Project Update',
          message: 'A project you are working on has been updated',
          priority: NotificationPriority.MEDIUM
        },
        {
          type: NotificationType.DEADLINE_REMINDER,
          title: 'Deadline Reminder',
          message: 'Project deadline is approaching',
          priority: NotificationPriority.MEDIUM
        }
      ];

      const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      
      this.createNotification({
        userId: currentUser.id,
        type: randomNotification.type,
        title: randomNotification.title,
        message: randomNotification.message,
        priority: randomNotification.priority,
        actionUrl: '/dashboard'
      }).subscribe();
    }
  }

  private updateNotificationState(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    const userNotifications = this.mockNotifications
      .filter(n => n.userId === currentUser.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const unreadCount = userNotifications.filter(n => !n.isRead).length;

    this.notificationsSubject.next(userNotifications);
    this.unreadCountSubject.next(unreadCount);
  }

  // Helper methods for specific notification types
  notifyTaskAssigned(userId: string, taskTitle: string, taskId: string, projectId: string): Observable<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You have been assigned to "${taskTitle}"`,
      priority: NotificationPriority.HIGH,
      actionUrl: `/projects/${projectId}/tasks`,
      actionText: 'View Task',
      metadata: { taskId, projectId }
    });
  }

  notifyTaskDue(userId: string, taskTitle: string, dueDate: Date, taskId: string): Observable<Notification> {
    const hoursUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60));
    const timeText = hoursUntilDue > 24 ? `${Math.ceil(hoursUntilDue / 24)} days` : `${hoursUntilDue} hours`;
    
    return this.createNotification({
      userId,
      type: NotificationType.TASK_DUE,
      title: 'Task Due Soon',
      message: `Task "${taskTitle}" is due in ${timeText}`,
      priority: hoursUntilDue <= 4 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
      actionUrl: '/tasks',
      actionText: 'View Task',
      metadata: { taskId, dueDate }
    });
  }

  notifyProjectAssigned(userId: string, projectName: string, projectId: string): Observable<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.PROJECT_ASSIGNED,
      title: 'Added to Project',
      message: `You have been added to project "${projectName}"`,
      priority: NotificationPriority.MEDIUM,
      actionUrl: `/projects/${projectId}`,
      actionText: 'View Project',
      metadata: { projectId }
    });
  }
}