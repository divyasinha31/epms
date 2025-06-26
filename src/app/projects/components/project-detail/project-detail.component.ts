import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { ProjectService } from '../../services/project.service';
import { Project, ProjectStatus } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  project?: Project;
  teamMembers: User[] = [];
  recentActivities: any[] = [];
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProjectData(projectId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProjectData(projectId: string): void {
    this.loading = true;

    forkJoin({
      project: this.projectService.getProject(projectId),
      users: this.projectService.getAvailableUsers()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.project = data.project;
        this.teamMembers = data.users.filter(user => 
          this.project?.teamMembers.includes(user.id)
        );
        this.loadRecentActivities();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.notificationService.showError('Failed to load project');
        this.goBack();
      }
    });
  }

  private loadRecentActivities(): void {
    // Mock data - replace with real API call
    this.recentActivities = [
      {
        id: 1,
        message: 'Project status updated to In Progress',
        user: 'John Manager',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        icon: 'update'
      },
      {
        id: 2,
        message: 'New team member added to project',
        user: 'Jane Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        icon: 'person_add'
      },
      {
        id: 3,
        message: 'Project deadline extended',
        user: 'Mike PM',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        icon: 'schedule'
      }
    ];
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/projects']);
  }

  viewTasks(): void {
    this.router.navigate(['/projects', this.project?.id, 'tasks']);
  }

  editProject(): void {
    this.router.navigate(['/projects', this.project?.id, 'edit']);
  }

  assignUsers(): void {
    this.router.navigate(['/projects', this.project?.id, 'assign-users']);
  }

  // Action methods
  duplicateProject(): void {
    this.notificationService.showInfo('Duplicate project feature coming soon');
  }

  exportProject(): void {
    this.notificationService.showInfo('Export project feature coming soon');
  }

  deleteProject(): void {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(this.project!.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Project deleted successfully');
            this.goBack();
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            this.notificationService.showError('Failed to delete project');
          }
        });
    }
  }

  removeMember(userId: string): void {
    if (confirm('Are you sure you want to remove this member from the project?')) {
      const updatedTeamMembers = this.project!.teamMembers.filter(id => id !== userId);
      
      this.projectService.assignUsers(this.project!.id, updatedTeamMembers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (project) => {
            this.project = project;
            this.teamMembers = this.teamMembers.filter(member => member.id !== userId);
            this.notificationService.showSuccess('Team member removed successfully');
          },
          error: (error) => {
            console.error('Error removing team member:', error);
            this.notificationService.showError('Failed to remove team member');
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

  getProjectProgress(): number {
    if (!this.project) return 0;
    
    const now = new Date();
    const start = new Date(this.project.startDate);
    const end = new Date(this.project.endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.round((elapsed / total) * 100);
  }

  getProjectDuration(): number {
    if (!this.project) return 0;
    
    const start = new Date(this.project.startDate);
    const end = new Date(this.project.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}