import { Component, OnInit } from '@angular/core';
import { NotificationService } from './core/services/notification.service';
import { ApiService } from './core/services/api.service';
import { User, UserRole } from './core/models/user.model';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentUser: User | null;

  readonly UserRole = UserRole;

  constructor(private notificationService: NotificationService, private apiService: ApiService, private authService: AuthService) {
    this.currentUser = null;
  }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    // Test notification service
    setTimeout(() => {
      this.notificationService.showSuccess('EPMS Application Started Successfully!');
    }, 1000);
  }

  testNotifications(): void {
    this.notificationService.showInfo('This is an info message');
    setTimeout(() => this.notificationService.showWarning('This is a warning'), 1000);
    setTimeout(() => this.notificationService.showError('This is an error'), 2000);
    setTimeout(() => this.notificationService.showSuccess('This is success'), 3000);
  }

  mockLoginAs(role: UserRole): void {
    const email = role === UserRole.ADMIN ? 'admin@epms.com' : 
                  role === UserRole.PROJECT_MANAGER ? 'manager@epms.com' : 
                  'developer@epms.com';
    
    this.authService.mockLogin(email, role);
    this.notificationService.showSuccess(`Logged in as ${this.getRoleDisplayName(role)}`);
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.showInfo('Logged out successfully');
  }

  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.PROJECT_MANAGER:
        return 'Project Manager';
      case UserRole.DEVELOPER:
        return 'Developer';
      default:
        return 'User';
    }
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  hasRole(role: UserRole): boolean {
    return this.authService.hasRole(role);
  }
}
