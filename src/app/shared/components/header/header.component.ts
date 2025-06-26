import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../../../core/models/user.model';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() currentUser!: User;
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(private authService: AuthService, private notificationService: NotificationService, private router: Router) { }

  ngOnInit(): void {}

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.showInfo('Logged out successfully');
    this.router.navigate(['/auth/login']);
  }

  getUserRoleDisplayName(): string {
    switch (this.currentUser?.role) {
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

  getUserInitials(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`;
  }

  navigateToProfile(): void {
    // TODO: Implement profile navigation
    this.notificationService.showInfo('Profile page coming soon');
  }

  navigateToSettings(): void {
    // TODO: Implement settings navigation
    this.notificationService.showInfo('Settings page coming soon');
  }
}
