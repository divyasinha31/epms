import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { ProjectService, ProjectFilters } from '../../services/project.service';
import { Project, ProjectStatus } from '../../../core/models/project.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  loading = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalProjects = 0;

  // Filters
  filters: ProjectFilters = {
    search: '',
    status: undefined,
    startDate: undefined,
    endDate: undefined
  };

  // Table configuration
  displayedColumns: string[] = ['name', 'status', 'dates', 'team', 'actions'];

  private destroy$ = new Subject<void>();
  private filtersChange$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.setupFiltersDebounce();
    this.loadProjects();
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
        this.loadProjects();
      });
  }

  loadProjects(): void {
    this.loading = true;
    
    this.projectService.getProjects(this.currentPage, this.pageSize, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.projects = response.projects;
          this.totalProjects = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.notificationService.showError('Failed to load projects');
          this.loading = false;
        }
      });
  }

  onFiltersChange(): void {
    this.filtersChange$.next();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: undefined,
      startDate: undefined,
      endDate: undefined
    };
    this.onFiltersChange();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  onSortChange(sort: Sort): void {
    // Implement sorting logic here
    console.log('Sort changed:', sort);
    this.loadProjects();
  }

  // Navigation methods
  createProject(): void {
    this.router.navigate(['/projects/new']);
  }

  viewProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  editProject(projectId: string): void {
    this.router.navigate(['/projects', projectId, 'edit']);
  }

  assignUsers(projectId: string): void {
    this.router.navigate(['/projects', projectId, 'assign-users']);
  }

  deleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(projectId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Project deleted successfully');
            this.loadProjects();
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            this.notificationService.showError('Failed to delete project');
          }
        });
    }
  }

  // Helper methods
  getStatusDisplayName(status: ProjectStatus): string {
    const statusMap = {
      [ProjectStatus.PLANNING]: 'Planning',
      [ProjectStatus.IN_PROGRESS]: 'In Progress',
      [ProjectStatus.ON_HOLD]: 'On Hold',
      [ProjectStatus.COMPLETED]: 'Completed',
      [ProjectStatus.CANCELLED]: 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getProjectProgress(project: Project): number {
    const now = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.round((elapsed / total) * 100);
  }
}
