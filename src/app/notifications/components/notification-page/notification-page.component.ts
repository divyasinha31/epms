import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationType, NotificationFilters } from '../../models/notification.model';
import { NotificationService as ToastService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-page',
  templateUrl: './notification-page.component.html',
  styleUrls: ['./notification-page.component.scss']
})
export class NotificationPageComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  totalNotifications = 0;
  unreadCount = 0;
  loading = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 25;
  
  // Filters
  filters: NotificationFilters = {};
  
  // Selection
  selectedNotifications: string[] = [];
  
  private destroy$ = new Subject<void>();
  private filtersChange$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupFiltersDebounce();
    this.loadNotifications();
    this.subscribeToUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFiltersDebounce(): void {
    this.filtersChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadNotifications();
      });
  }

  private loadNotifications(): void {
    this.loading = true;
    
    this.notificationService.getNotifications(this.currentPage, this.pageSize, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notifications = response.notifications;
          this.totalNotifications = response.total;
          this.unreadCount = response.unreadCount;
          this.loading = false;
          this.clearSelection();
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.toastService.showError('Failed to load notifications');
          this.loading = false;
        }
      });
  }

  private subscribeToUnreadCount(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  // Filter methods
  onFiltersChange(): void {
    this.filtersChange$.next();
  }

  clearFilters(): void {
    this.filters = {};
    this.onFiltersChange();
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadNotifications();
  }

  // Selection methods
  toggleSelection(notificationId: string, selected: boolean): void {
    if (selected) {
      if (!this.selectedNotifications.includes(notificationId)) {
        this.selectedNotifications.push(notificationId);
      }
    } else {
      this.selectedNotifications = this.selectedNotifications.filter(id => id !== notificationId);
    }
  }

  isSelected(notificationId: string): boolean {
    return this.selectedNotifications.includes(notificationId);
  }

  clearSelection(): void {
    this.selectedNotifications = [];
  }

  hasUnreadSelected(): boolean {
    return this.selectedNotifications.some(id => {
      const notification = this.notifications.find(n => n.id === id);
      return notification && !notification.isRead;
    });
  }

  // Bulk actions
  bulkMarkAsRead(): void {
    const unreadSelected = this.selectedNotifications.filter(id => {
      const notification = this.notifications.find(n => n.id === id);
      return notification && !notification.isRead;
    });

    if (unreadSelected.length === 0) return;

    // Mark each selected unread notification as read
    unreadSelected.forEach(id => {
      this.notificationService.markAsRead(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const notification = this.notifications.find(n => n.id === id);
            if (notification) {
              notification.isRead = true;
              notification.readAt = new Date();
            }
          },
          error: (error) => {
            console.error('Error marking notification as read:', error);
          }
        });
    });

    this.toastService.showSuccess(`${unreadSelected.length} notification(s) marked as read`);
    this.clearSelection();
  }

  bulkDelete(): void {
    if (this.selectedNotifications.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${this.selectedNotifications.length} notification(s)?`;
    if (!confirm(confirmMessage)) return;

    this.selectedNotifications.forEach(id => {
      this.notificationService.deleteNotification(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notifications = this.notifications.filter(n => n.id !== id);
          },
          error: (error) => {
            console.error('Error deleting notification:', error);
          }
        });
    });

    this.toastService.showSuccess(`${this.selectedNotifications.length} notification(s) deleted`);
    this.clearSelection();
  }

  // Individual actions
  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }
    
    if (notification.actionUrl) {
      this.navigateToAction(notification);
    }
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.isRead = true;
          notification.readAt = new Date();
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
  }

  toggleReadStatus(notification: Notification): void {
    const action = notification.isRead ? 'markAsUnread' : 'markAsRead';
    
    this.notificationService[action](notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.isRead = !notification.isRead;
          notification.readAt = notification.isRead ? new Date() : undefined;
          
          const message = notification.isRead ? 'Marked as read' : 'Marked as unread';
          this.toastService.showSuccess(message);
        },
        error: (error) => {
          console.error(`Error ${action}:`, error);
          this.toastService.showError('Failed to update notification');
        }
      });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.forEach(n => {
            n.isRead = true;
            n.readAt = new Date();
          });
          this.unreadCount = 0;
          this.toastService.showSuccess('All notifications marked as read');
        },
        error: (error) => {
          console.error('Error marking all as read:', error);
          this.toastService.showError('Failed to mark all as read');
        }
      });
  }

  deleteNotification(notification: Notification): void {
    this.notificationService.deleteNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          if (!notification.isRead) {
            this.unreadCount--;
          }
          this.totalNotifications--;
          this.toastService.showSuccess('Notification deleted');
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
          this.toastService.showError('Failed to delete notification');
        }
      });
  }

  navigateToAction(notification: Notification): void {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  // Helper methods
  getNotificationIcon(type: NotificationType): string {
    const iconMap = {
      [NotificationType.TASK_ASSIGNED]: 'assignment_ind',
      [NotificationType.TASK_DUE]: 'schedule',
      [NotificationType.TASK_OVERDUE]: 'warning',
      [NotificationType.TASK_COMPLETED]: 'check_circle',
      [NotificationType.PROJECT_ASSIGNED]: 'work',
      [NotificationType.PROJECT_UPDATED]: 'update',
      [NotificationType.USER_MENTIONED]: 'alternate_email',
      [NotificationType.DEADLINE_REMINDER]: 'alarm',
      [NotificationType.SYSTEM]: 'info'
    };
    
    return iconMap[type] || 'notifications';
  }

  getTypeDisplayName(type: NotificationType): string {
    const typeMap = {
      [NotificationType.TASK_ASSIGNED]: 'Task Assignment',
      [NotificationType.TASK_DUE]: 'Task Due',
      [NotificationType.TASK_OVERDUE]: 'Task Overdue',
      [NotificationType.TASK_COMPLETED]: 'Task Completed',
      [NotificationType.PROJECT_ASSIGNED]: 'Project Assignment',
      [NotificationType.PROJECT_UPDATED]: 'Project Update',
      [NotificationType.USER_MENTIONED]: 'Mention',
      [NotificationType.DEADLINE_REMINDER]: 'Deadline Reminder',
      [NotificationType.SYSTEM]: 'System'
    };
    
    return typeMap[type] || type;
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else if (diffInMinutes < 10080) {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }
}
