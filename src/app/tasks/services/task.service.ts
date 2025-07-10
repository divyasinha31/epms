import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';
import { NotificationIntegrationService } from '../../notifications/services/notification-integration.service';

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: Date;
  estimatedHours: number;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: TaskStatus;
  actualHours?: number;
  order?: number;
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private apiService: ApiService, private notificationIntegration: NotificationIntegrationService) {}

  getProjectTasks(projectId: string, filters?: TaskFilters): Observable<Task[]> {
    // Mock data - replace with real API call
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Setup Authentication System',
        description: 'Implement JWT authentication with login/logout functionality',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        projectId,
        assigneeId: 'dev1',
        dueDate: new Date('2024-03-15'),
        estimatedHours: 16,
        actualHours: 14,
        order: 1,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: '2',
        title: 'Design User Dashboard',
        description: 'Create wireframes and mockups for the main user dashboard',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        projectId,
        assigneeId: 'dev2',
        dueDate: new Date('2024-03-10'),
        estimatedHours: 12,
        actualHours: 10,
        order: 2,
        createdAt: new Date('2024-02-03'),
        updatedAt: new Date('2024-02-12')
      },
      {
        id: '3',
        title: 'Implement Project Management API',
        description: 'Build REST API endpoints for project CRUD operations',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        projectId,
        assigneeId: 'dev1',
        dueDate: new Date('2024-03-25'),
        estimatedHours: 24,
        actualHours: 8,
        order: 1,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-20')
      },
      {
        id: '4',
        title: 'Setup Database Schema',
        description: 'Design and implement database tables for the application',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        projectId,
        assigneeId: 'dev3',
        dueDate: new Date('2024-03-20'),
        estimatedHours: 20,
        actualHours: 12,
        order: 2,
        createdAt: new Date('2024-02-07'),
        updatedAt: new Date('2024-02-18')
      },
      {
        id: '5',
        title: 'Frontend Component Library',
        description: 'Create reusable UI components for the frontend',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        projectId,
        assigneeId: 'dev2',
        dueDate: new Date('2024-04-05'),
        estimatedHours: 32,
        actualHours: 0,
        order: 1,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10')
      }
    ];

    // Apply filters
    let filteredTasks = [...mockTasks];

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    if (filters?.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters?.assigneeId) {
      filteredTasks = filteredTasks.filter(task => task.assigneeId === filters.assigneeId);
    }

    if (filters?.dueDateFrom) {
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate >= filters.dueDateFrom!
      );
    }

    if (filters?.dueDateTo) {
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate <= filters.dueDateTo!
      );
    }

    return of(filteredTasks);
  }

  getTaskColumns(projectId: string, filters?: TaskFilters): Observable<TaskColumn[]> {
    return this.getProjectTasks(projectId, filters).pipe(
      map(tasks => {
        const columns: TaskColumn[] = [
          {
            id: TaskStatus.TODO,
            title: 'To Do',
            tasks: tasks.filter(task => task.status === TaskStatus.TODO)
                        .sort((a, b) => a.order - b.order),
            color: '#2196f3'
          },
          {
            id: TaskStatus.IN_PROGRESS,
            title: 'In Progress',
            tasks: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS)
                        .sort((a, b) => a.order - b.order),
            color: '#ff9800'
          },
          {
            id: TaskStatus.DONE,
            title: 'Done',
            tasks: tasks.filter(task => task.status === TaskStatus.DONE)
                        .sort((a, b) => a.order - b.order),
            color: '#4caf50'
          }
        ];
        return columns;
      })
    );
  }

  getTask(taskId: string): Observable<Task> {
    // Mock data - replace with real API call
    const mockTask: Task = {
      id: taskId,
      title: 'Sample Task',
      description: 'This is a sample task description',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      projectId: 'project1',
      assigneeId: 'dev1',
      dueDate: new Date('2024-03-30'),
      estimatedHours: 8,
      actualHours: 4,
      order: 1,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-20')
    };

    return of(mockTask);
  }

  createTask(task: CreateTaskRequest): Observable<Task> {
    const newTask: Task = {
      id: Date.now().toString(),
      ...task,
      status: TaskStatus.TODO,
      actualHours: 0,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Get assignee details and send notification
    return this.getProjectUsers(task.projectId).pipe(
      map(users => users.find(user => user.id === task.assigneeId)),
      switchMap(assignee => {
        if (assignee) {
          return this.notificationIntegration.notifyTaskAssigned(newTask, assignee).pipe(
            map(() => newTask)
          );
        }
        return of(newTask);
      })
    );
  }

  updateTask(taskId: string, updates: UpdateTaskRequest): Observable<Task> {
    return this.getTask(taskId).pipe(
      switchMap(currentTask => {
        const updatedTask: Task = {
          ...currentTask,
          ...updates,
          updatedAt: new Date()
        };

        // Get assignee details for notifications
        return this.getProjectUsers(currentTask.projectId).pipe(
          map(users => users.find(user => user.id === currentTask.assigneeId)),
          switchMap(assignee => {
            if (!assignee) {
              return of(updatedTask);
            }

            // Check if status changed to done
            if (updates.status === TaskStatus.DONE && currentTask.status !== TaskStatus.DONE) {
              return this.notificationIntegration.notifyTaskStatusChanged(
                updatedTask, currentTask.status, updates.status, assignee
              ).pipe(
                map(() => updatedTask)
              );
            }

            return of(updatedTask);
          })
        );
      })
    );
  }

  updateTaskStatus(taskId: string, status: TaskStatus, order?: number): Observable<Task> {
    const updates: UpdateTaskRequest = { status };
    if (order !== undefined) {
      updates.order = order;
    }
    return this.updateTask(taskId, updates);
  }

  deleteTask(taskId: string): Observable<void> {
    // Mock data - replace with real API call
    return of(void 0);
  }

  reorderTasks(projectId: string, tasks: { taskId: string; status: TaskStatus; order: number }[]): Observable<void> {
    // Mock data - replace with real API call
    console.log('Reordering tasks:', tasks);
    return of(void 0);
  }

  getProjectUsers(projectId: string): Observable<User[]> {
    // Mock data - replace with real API call
    const mockUsers: User[] = [
      {
        id: 'dev1',
        email: 'john.dev@company.com',
        firstName: 'John',
        lastName: 'Developer',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev2',
        email: 'jane.dev@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev3',
        email: 'mike.dev@company.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev4',
        email: 'sarah.dev@company.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return of(mockUsers);
  }

  // Method to check for due tasks and send reminders
  checkTaskDueDates(): Observable<void> {
    // Get all active projects and their tasks
    return this.getProjectTasks('all').pipe(
      switchMap(allTasks => {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        // Find tasks due soon
        const tasksDueSoon = allTasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate <= tomorrow && dueDate > now && task.status !== TaskStatus.DONE;
        });

        if (tasksDueSoon.length === 0) {
          return of(void 0);
        }

        // Get all users
        return this.getProjectUsers('all').pipe(
          switchMap(allUsers => {
            const notificationPromises = tasksDueSoon.map(task => {
              const assignee = allUsers.find(user => user.id === task.assigneeId);
              if (assignee) {
                return this.notificationIntegration.notifyTaskDueSoon(task, assignee);
              }
              return of(null);
            });

            return forkJoin(notificationPromises.filter(p => p !== null)).pipe(
              map(() => void 0)
            );
          })
        );
      })
    );
  }

  // Method to check for overdue tasks
  checkOverdueTasks(): Observable<void> {
    return this.getProjectTasks('all').pipe(
      switchMap(allTasks => {
        const now = new Date();
        
        // Find overdue tasks
        const overdueTasks = allTasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate < now && task.status !== TaskStatus.DONE;
        });

        if (overdueTasks.length === 0) {
          return of(void 0);
        }

        // Get all users
        return this.getProjectUsers('all').pipe(
          switchMap(allUsers => {
            const notificationPromises = overdueTasks.map(task => {
              const assignee = allUsers.find(user => user.id === task.assigneeId);
              if (assignee) {
                return this.notificationIntegration.notifyTaskOverdue(task, assignee);
              }
              return of(null);
            });

            return forkJoin(notificationPromises.filter(p => p !== null)).pipe(
              map(() => void 0)
            );
          })
        );
      })
    );
  }
}