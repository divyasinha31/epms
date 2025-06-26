import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { TaskFilters } from '../../services/task.service';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-task-filters',
  templateUrl: './task-filters.component.html',
  styleUrls: ['./task-filters.component.scss']
})
export class TaskFiltersComponent implements OnInit {
  @Input() availableUsers: User[] = [];
  @Output() filtersChange = new EventEmitter<TaskFilters>();

  filters: TaskFilters = {
    search: '',
    priority: undefined,
    assigneeId: undefined,
    dueDateFrom: undefined,
    dueDateTo: undefined
  };

  quickFilter: string | null = null;
  currentUserId?: string;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUserId = user?.id;
    });
  }

  onFiltersChange(): void {
    this.quickFilter = null; // Clear quick filter when manual filters change
    this.filtersChange.emit({ ...this.filters });
  }

  clearSearch(): void {
    this.filters.search = '';
    this.onFiltersChange();
  }

  setQuickFilter(filter: string): void {
    if (this.quickFilter === filter) {
      // Toggle off if already selected
      this.quickFilter = null;
      this.clearAllFilters();
      return;
    }

    this.quickFilter = filter;
    this.clearAllFilters(); // Clear existing filters first

    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'overdue':
        this.filters.dueDateTo = today;
        break;
      case 'today':
        this.filters.dueDateFrom = today;
        this.filters.dueDateTo = today;
        break;
      case 'week':
        this.filters.dueDateFrom = today;
        this.filters.dueDateTo = oneWeekFromNow;
        break;
      case 'my-tasks':
        this.filters.assigneeId = this.currentUserId;
        break;
    }

    this.filtersChange.emit({ ...this.filters });
  }

  clearAllFilters(): void {
    this.filters = {
      search: '',
      priority: undefined,
      assigneeId: undefined,
      dueDateFrom: undefined,
      dueDateTo: undefined
    };
    this.quickFilter = null;
    this.filtersChange.emit({ ...this.filters });
  }
}