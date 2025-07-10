import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() assignee?: User;
  @Output() taskClick = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<TaskStatus>();
  @Output() deleteTask = new EventEmitter<void>();

  readonly TaskStatus = TaskStatus;

  onTaskClick(): void {
    this.taskClick.emit();
  }

  changeStatus(status: TaskStatus): void {
    this.statusChange.emit(status);
  }

  onDeleteTask(): void {
    this.deleteTask.emit();
  }

  isOverdue(): boolean {
    const today = new Date();
    const dueDate = new Date(this.task.dueDate);
    return dueDate < today && this.task.status !== TaskStatus.DONE;
  }

  getPriorityIcon(): string {
    const icons = {
      [TaskPriority.LOW]: 'keyboard_arrow_down',
      [TaskPriority.MEDIUM]: 'remove',
      [TaskPriority.HIGH]: 'keyboard_arrow_up',
      [TaskPriority.CRITICAL]: 'priority_high'
    };
    return icons[this.task.priority] || 'remove';
  }

  getStatusDisplayName(): string {
    const statusMap = {
      [TaskStatus.TODO]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.DONE]: 'Done'
    };
    return statusMap[this.task.status] || this.task.status;
  }

  getProgressPercentage(): number {
    if (this.task.estimatedHours === 0) return 0;
    return Math.min(100, (this.task.actualHours / this.task.estimatedHours) * 100);
  }
}
