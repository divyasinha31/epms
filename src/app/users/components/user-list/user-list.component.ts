import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { UserService, UserFilters } from '../../services/user.service';
import { User, UserRole } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalUsers: number = 0;

  // Filters
  filters: UserFilters = {
    search: '',
    role: undefined,
    isActive: undefined
  };

  // Table configuration
  displayedColumns: string[] = ['avatar', 'name', 'email', 'role', 'status', 'actions'];

  // Enums for template
  readonly UserRole = UserRole;

  private destroy$ = new Subject<void>();
  private filtersChange$ = new Subject<void>();

  constructor(private userService: UserService, private notificationService: NotificationService, private router: Router) { }

  ngOnInit(): void {
    this.setupFiltersDebounce();
    this.loadUsers();
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
        this.loadUsers();
      });
  }

  loadUsers(): void {
    this.loading = true;
    
    this.userService.getUsers(this.currentPage, this.pageSize, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.users;
          this.totalUsers = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.notificationService.showError('Failed to load users');
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
      role: undefined,
      isActive: undefined
    };
    this.onFiltersChange();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    // Implement sorting logic here
    console.log('Sort changed:', sort);
    this.loadUsers();
  }

  // Navigation methods
  createUser(): void {
    this.router.navigate(['/users/new']);
  }

  editUser(userId: string): void {
    this.router.navigate(['/users', userId, 'edit']);
  }

  viewUser(userId: string): void {
    this.router.navigate(['/users', userId]);
  }

  // Action methods
  toggleUserStatus(user: User): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    const message = `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`;
    
    if (confirm(message)) {
      this.userService.toggleUserStatus(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess(`User ${action}d successfully`);
            this.loadUsers();
          },
          error: (error) => {
            console.error(`Error ${action}ing user:`, error);
            this.notificationService.showError(`Failed to ${action} user`);
          }
        });
    }
  }

  resetPassword(user: User): void {
    const message = `Are you sure you want to reset password for ${user.firstName} ${user.lastName}?`;
    
    if (confirm(message)) {
      this.userService.resetPassword(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Password reset successfully. New password sent to user.');
          },
          error: (error) => {
            console.error('Error resetting password:', error);
            this.notificationService.showError('Failed to reset password');
          }
        });
    }
  }

  deleteUser(user: User): void {
    const message = `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`;
    
    if (confirm(message)) {
      this.userService.deleteUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('User deleted successfully');
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.notificationService.showError('Failed to delete user');
          }
        });
    }
  }

  // Helper methods
  getRoleDisplayName(role: UserRole): string {
    const roleMap = {
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.PROJECT_MANAGER]: 'Project Manager',
      [UserRole.DEVELOPER]: 'Developer'
    };
    return roleMap[role] || role;
  }

  getRoleColor(role: UserRole): string {
    const colorMap = {
      [UserRole.ADMIN]: '#f44336',
      [UserRole.PROJECT_MANAGER]: '#2196f3',
      [UserRole.DEVELOPER]: '#4caf50'
    };
    return colorMap[role] || '#666';
  }

  getUserInitials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  }
}
