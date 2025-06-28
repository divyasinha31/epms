import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { TaskService, CreateTaskRequest, UpdateTaskRequest } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit, OnDestroy {
  taskForm!: FormGroup;
  isEditMode = false;
  loading = false;
  projectId?: string;
  taskId?: string;

  availableUsers: User[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.getRouteParams();
    this.loadUsers();
    
    if (this.isEditMode && this.taskId) {
      this.loadTask(this.taskId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      priority: [TaskPriority.MEDIUM, Validators.required],
      status: [TaskStatus.TODO],
      assigneeId: ['', Validators.required],
      dueDate: ['', Validators.required],
      estimatedHours: [0, [Validators.required, Validators.min(0)]],
      actualHours: [0, [Validators.min(0)]]
    });
  }

  private getRouteParams(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || undefined;
    this.taskId = this.route.snapshot.paramMap.get('taskId') || undefined;
    this.isEditMode = !!this.taskId && this.taskId !== 'new';
  }

  private loadUsers(): void {
    if (!this.projectId) return;

    this.taskService.getProjectUsers(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.availableUsers = users;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.notificationService.showError('Failed to load users');
        }
      });
  }

  private loadTask(taskId: string): void {
    this.loading = true;
    
    this.taskService.getTask(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.populateForm(task);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading task:', error);
          this.notificationService.showError('Failed to load task');
          this.goBack();
        }
      });
  }

  private populateForm(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours
    });
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.loading = true;
      
      if (this.isEditMode && this.taskId) {
        this.updateTask();
      } else {
        this.createTask();
      }
    }
  }

  private createTask(): void {
    const formValue = this.taskForm.value;
    const request: CreateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority,
      projectId: this.projectId!,
      assigneeId: formValue.assigneeId,
      dueDate: formValue.dueDate,
      estimatedHours: formValue.estimatedHours
    };

    this.taskService.createTask(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.notificationService.showSuccess('Task created and assignee notified!');
          this.goBack();
        },
        error: (error) => {
          console.error('Error creating task:', error);
          this.notificationService.showError('Failed to create task');
          this.loading = false;
        }
      });
  }

  private updateTask(): void {
    const formValue = this.taskForm.value;
    const request: UpdateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority,
      status: formValue.status,
      assigneeId: formValue.assigneeId,
      dueDate: formValue.dueDate,
      estimatedHours: formValue.estimatedHours,
      actualHours: formValue.actualHours
    };

    this.taskService.updateTask(this.taskId!, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Task updated successfully');
          this.goBack();
        },
        error: (error) => {
          console.error('Error updating task:', error);
          this.notificationService.showError('Failed to update task');
          this.loading = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId, 'tasks']);
  }
}