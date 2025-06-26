import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';

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

  constructor(private apiService: ApiService) {}

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
      },
      {
        id: '6',
        title: 'Write Unit Tests',
        description: 'Implement comprehensive unit tests for core functionality',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        projectId,
        assigneeId: 'dev1',
        dueDate: new Date('2024-04-15'),
        estimatedHours: 16,
        actualHours: 0,
        order: 2,
        createdAt: new Date('2024-02-12'),
        updatedAt: new Date('2024-02-12')
      },
      {
        id: '7',
        title: 'Performance Optimization',
        description: 'Optimize application performance and loading times',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        projectId,
        assigneeId: 'dev3',
        dueDate: new Date('2024-04-30'),
        estimatedHours: 20,
        actualHours: 0,
        order: 3,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
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
    // Real API call would be:
    // return this.apiService.get<Task[]>(`/projects/${projectId}/tasks`, filters);
  }

  getTaskColumns(projectId: string, filters?: TaskFilters): Observable<TaskColumn[]> {
    return new Observable(observer => {
      this.getProjectTasks(projectId, filters).subscribe(tasks => {
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
        observer.next(columns);
        observer.complete();
      });
    });
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
    // Real API call would be:
    // return this.apiService.get<Task>(`/tasks/${taskId}`);
  }

  createTask(task: CreateTaskRequest): Observable<Task> {
    // Mock data - replace with real API call
    const newTask: Task = {
      id: Date.now().toString(),
      ...task,
      status: TaskStatus.TODO,
      actualHours: 0,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(newTask);
    // Real API call would be:
    // return this.apiService.post<Task>('/tasks', task);
  }

  updateTask(taskId: string, updates: UpdateTaskRequest): Observable<Task> {
    // Mock data - replace with real API call
    const updatedTask: Task = {
      id: taskId,
      title: updates.title || 'Updated Task',
      description: updates.description || 'Updated description',
      status: updates.status || TaskStatus.TODO,
      priority: updates.priority || TaskPriority.MEDIUM,
      projectId: updates.projectId || 'project1',
      assigneeId: updates.assigneeId || 'dev1',
      dueDate: updates.dueDate || new Date(),
      estimatedHours: updates.estimatedHours || 8,
      actualHours: updates.actualHours || 0,
      order: updates.order || 1,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date()
    };

    return of(updatedTask);
    // Real API call would be:
    // return this.apiService.put<Task>(`/tasks/${taskId}`, updates);
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
    // Real API call would be:
    // return this.apiService.delete<void>(`/tasks/${taskId}`);
  }

  reorderTasks(projectId: string, tasks: { taskId: string; status: TaskStatus; order: number }[]): Observable<void> {
    // Mock data - replace with real API call
    console.log('Reordering tasks:', tasks);
    return of(void 0);
    // Real API call would be:
    // return this.apiService.patch<void>(`/projects/${projectId}/tasks/reorder`, { tasks });
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
      }
    ];

    return of(mockUsers);
    // Real API call would be:
    // return this.apiService.get<User[]>(`/projects/${projectId}/users`);
  }
}