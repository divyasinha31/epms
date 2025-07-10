import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, TaskColumn, TaskFilters } from '../../services/task.service';
import { ProjectService } from '../../../projects/services/project.service';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-task-board',
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss']
})
export class TaskBoardComponent implements OnInit, OnDestroy {
  projectId?: string;
  projectName: string = '';
  columns: TaskColumn[] = [];
  availableUsers: User[] = [];
  loading: boolean = false;
  filters: TaskFilters = {};

  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private router: Router, private taskService: TaskService,
    private projectService: ProjectService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || undefined;
    if (this.projectId) {
      this.loadData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading = true;

    // Load project info
    this.projectService.getProject(this.projectId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.projectName = project.name;
        },
        error: (error) => {
          console.error('Error loading project:', error);
          this.notificationService.showError('Failed to load project');
        }
      });

    // Load users
    this.taskService.getProjectUsers(this.projectId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.availableUsers = users;
        },
        error: (error) => {
          console.error('Error loading users:', error);
        }
      });

    // Load tasks
    this.loadTasks();
  }

  private loadTasks(): void {
    this.taskService.getTaskColumns(this.projectId!, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (columns) => {
          this.columns = columns;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading tasks:', error);
          this.notificationService.showError('Failed to load tasks');
          this.loading = false;
        }
      });
  }

  onFiltersChange(filters: TaskFilters): void {
    this.filters = filters;
    this.loadTasks();
  }

  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    const task = event.item.data;
    const newStatus = event.container.id as TaskStatus;
    const newOrder = event.currentIndex + 1;

    if (event.previousContainer === event.container) {
      // Reorder within same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateTaskOrder(event.container.data);
    } else {
      // Move to different column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task status and order
      this.taskService.updateTaskStatus(task.id, newStatus, newOrder)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Task status updated');
            this.updateTaskOrder(event.container.data);
          },
          error: (error) => {
            console.error('Error updating task:', error);
            this.notificationService.showError('Failed to update task');
            // Revert the move
            this.loadTasks();
          }
        });
    }
  }

  private updateTaskOrder(tasks: Task[]): void {
    const reorderData = tasks.map((task, index) => ({
      taskId: task.id,
      status: task.status,
      order: index + 1
    }));

    this.taskService.reorderTasks(this.projectId!, reorderData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Error reordering tasks:', error);
          this.notificationService.showError('Failed to save task order');
        }
      });
  }

  onTaskStatusChange(task: Task, newStatus: TaskStatus): void {
    this.taskService.updateTaskStatus(task.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Task status updated');
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error updating task status:', error);
          this.notificationService.showError('Failed to update task status');
        }
      });
  }

  createTask(): void {
    this.router.navigate(['/projects', this.projectId, 'tasks', 'new']);
  }

  editTask(taskId: string): void {
    this.router.navigate(['/projects', this.projectId, 'tasks', taskId, 'edit']);
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Task deleted successfully');
            this.loadTasks();
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            this.notificationService.showError('Failed to delete task');
          }
        });
    }
  }

  getTaskAssignee(assigneeId: string): User | undefined {
    return this.availableUsers.find(user => user.id === assigneeId);
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  // TrackBy functions for performance
  trackByColumnId(index: number, column: TaskColumn): string {
    return column.id;
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
