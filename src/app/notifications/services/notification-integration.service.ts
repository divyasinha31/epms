import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { NotificationService } from './notification.service';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationType, NotificationPriority } from '../models/notification.model';
import { Task } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';
import { User } from '../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationIntegrationService {

  constructor(private notificationService: NotificationService, private authService: AuthService) {}

  // Task-related notifications
  notifyTaskAssigned(task: Task, assignee: User): Observable<any> {
    return this.notificationService.notifyTaskAssigned(
      assignee.id,
      task.title,
      task.id,
      task.projectId
    );
  }

  notifyTaskStatusChanged(task: Task, oldStatus: string, newStatus: string, assignee: User): Observable<any> {
    if (newStatus === 'done') {
      return this.notificationService.createNotification({
        userId: assignee.id,
        type: NotificationType.TASK_COMPLETED,
        title: 'Task Completed',
        message: `Great job! You completed "${task.title}"`,
        priority: NotificationPriority.LOW,
        actionUrl: `/projects/${task.projectId}/tasks`,
        actionText: 'View Tasks',
        metadata: { taskId: task.id, projectId: task.projectId }
      });
    }

    return of(null);
  }

  notifyTaskDueSoon(task: Task, assignee: User): Observable<any> {
    const dueDate = new Date(task.dueDate);
    return this.notificationService.notifyTaskDue(assignee.id, task.title, dueDate, task.id);
  }

  notifyTaskOverdue(task: Task, assignee: User): Observable<any> {
    return this.notificationService.createNotification({
      userId: assignee.id,
      type: NotificationType.TASK_OVERDUE,
      title: 'Task Overdue',
      message: `Task "${task.title}" is overdue. Please update its status.`,
      priority: NotificationPriority.URGENT,
      actionUrl: `/projects/${task.projectId}/tasks`,
      actionText: 'View Task',
      metadata: { taskId: task.id, projectId: task.projectId }
    });
  }

  // Project-related notifications
  notifyProjectAssigned(project: Project, users: User[]): Observable<any[]> {
    const notifications = users.map(user => 
      this.notificationService.notifyProjectAssigned(user.id, project.name, project.id)
    );

    return of(notifications);
  }

  notifyProjectUpdated(project: Project, teamMembers: User[], updateDetails: string): Observable<any[]> {
    const currentUser = this.authService.currentUserValue;
    
    // Don't notify the user who made the update
    const usersToNotify = teamMembers.filter(user => user.id !== currentUser?.id);
    
    const notifications = usersToNotify.map(user =>
      this.notificationService.createNotification({
        userId: user.id,
        type: NotificationType.PROJECT_UPDATED,
        title: 'Project Updated',
        message: `Project "${project.name}" has been updated: ${updateDetails}`,
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/projects/${project.id}`,
        actionText: 'View Project',
        metadata: { projectId: project.id }
      })
    );

    return of(notifications);
  }

  notifyProjectDeadlineApproaching(project: Project, teamMembers: User[], daysLeft: number): Observable<any[]> {
    const notifications = teamMembers.map(user =>
      this.notificationService.createNotification({
        userId: user.id,
        type: NotificationType.DEADLINE_REMINDER,
        title: 'Project Deadline Approaching',
        message: `Project "${project.name}" deadline is in ${daysLeft} days`,
        priority: daysLeft <= 3 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        actionUrl: `/projects/${project.id}`,
        actionText: 'View Project',
        metadata: { projectId: project.id, daysLeft }
      })
    );

    return of(notifications);
  }

  // User-related notifications
  notifyUserMentioned(mentionedUserId: string, mentionerName: string, context: string, actionUrl?: string): Observable<any> {
    return this.notificationService.createNotification({
      userId: mentionedUserId,
      type: NotificationType.USER_MENTIONED,
      title: 'You were mentioned',
      message: `${mentionerName} mentioned you in ${context}`,
      priority: NotificationPriority.MEDIUM,
      actionUrl,
      actionText: 'View',
      metadata: { mentioner: mentionerName, context }
    });
  }

  // System notifications
  notifySystemMaintenance(users: User[], maintenanceDate: Date): Observable<any[]> {
    const notifications = users.map(user =>
      this.notificationService.createNotification({
        userId: user.id,
        type: NotificationType.SYSTEM,
        title: 'Scheduled Maintenance',
        message: `System maintenance is scheduled for ${maintenanceDate.toLocaleDateString()}`,
        priority: NotificationPriority.MEDIUM,
        metadata: { maintenanceDate }
      })
    );

    return of(notifications);
  }

  // Bulk notification methods
  notifyMultipleUsers(userIds: string[], notificationData: {
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionText?: string;
    metadata?: any;
  }): Observable<any[]> {
    const notifications = userIds.map(userId =>
      this.notificationService.createNotification({
        userId,
        ...notificationData
      })
    );

    return of(notifications);
  }

  // Helper method to check and send due date reminders
  checkAndSendDueDateReminders(tasks: Task[], users: User[]): Observable<any[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const tasksDueSoon = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate <= tomorrow && dueDate > now && task.status !== 'done';
    });

    const notifications = tasksDueSoon.map(task => {
      const assignee = users.find(user => user.id === task.assigneeId);
      if (assignee) {
        return this.notifyTaskDueSoon(task, assignee);
      }
      return of(null);
    });

    return of(notifications.filter(n => n !== null));
  }

  // Helper method to check for overdue tasks
  checkAndSendOverdueNotifications(tasks: Task[], users: User[]): Observable<any[]> {
    const now = new Date();
    
    const overdueTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate < now && task.status !== 'done';
    });

    const notifications = overdueTasks.map(task => {
      const assignee = users.find(user => user.id === task.assigneeId);
      if (assignee) {
        return this.notifyTaskOverdue(task, assignee);
      }
      return of(null);
    });

    return of(notifications.filter(n => n !== null));
  }
}