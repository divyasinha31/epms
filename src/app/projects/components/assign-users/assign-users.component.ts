import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { ProjectService } from '../../services/project.service';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-assign-users',
  templateUrl: './assign-users.component.html',
  styleUrls: ['./assign-users.component.scss']
})
export class AssignUsersComponent implements OnInit, OnDestroy {
  projectId?: string;
  projectName = '';
  availableUsers: User[] = [];
  selectedUsers: User[] = [];
  searchTerm = '';
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || undefined;
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

    forkJoin({
      project: this.projectService.getProject(this.projectId!),
      users: this.projectService.getAvailableUsers()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.projectName = data.project.name;
        this.availableUsers = data.users.filter(user => user.isActive);
        this.selectedUsers = data.users.filter(user => 
          data.project.teamMembers.includes(user.id)
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.notificationService.showError('Failed to load project data');
        this.goBack();
      }
    });
  }

  getFilteredUsers(): User[] {
    if (!this.searchTerm) {
      return this.availableUsers;
    }

    const searchLower = this.searchTerm.toLowerCase();
    return this.availableUsers.filter(user =>
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.some(user => user.id === userId);
  }

  toggleUser(user: User, selected: boolean): void {
    if (selected) {
      if (!this.isUserSelected(user.id)) {
        this.selectedUsers.push(user);
      }
    } else {
      this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
    }
  }

  removeUser(user: User): void {
    this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
  }

  selectAll(): void {
    this.selectedUsers = [...this.availableUsers];
  }

  clearSelection(): void {
    this.selectedUsers = [];
  }

  get allSelected(): boolean {
    return this.selectedUsers.length === this.availableUsers.length;
  }

  saveAssignments(): void {
    if (this.selectedUsers.length === 0) {
      this.notificationService.showWarning('Please select at least one team member');
      return;
    }

    this.loading = true;
    const userIds = this.selectedUsers.map(user => user.id);

    this.projectService.assignUsers(this.projectId!, userIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Team members assigned successfully');
          this.router.navigate(['/projects', this.projectId]);
        },
        error: (error) => {
          console.error('Error assigning users:', error);
          this.notificationService.showError('Failed to assign team members');
          this.loading = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }
}