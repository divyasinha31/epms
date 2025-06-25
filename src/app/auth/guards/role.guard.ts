import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserRole } from '../../core/models/user.model';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const requiredRoles = route.data['roles'] as UserRole[];
  
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
    notificationService.showError('Access denied. Insufficient permissions.');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
