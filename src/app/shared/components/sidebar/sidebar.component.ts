import { Component, Input, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { User, UserRole } from '../../../core/models/user.model';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() currentUser!: User;
  @Input() isOpen = true;
  
  currentRoute = '';
  
  menuItems: MenuItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'dashboard'
    },
    {
      path: '/projects',
      label: 'Projects',
      icon: 'work',
      roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER]
    },
    {
      path: '/tasks',
      label: 'My Tasks',
      icon: 'assignment'
    },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: 'notifications'
    },
    {
      path: '/team',
      label: 'Team',
      icon: 'people',
      roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER]
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: 'assessment',
      roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER]
    },
    {
      path: '/users',
      label: 'User Management',
      icon: 'admin_panel_settings',
      roles: [UserRole.ADMIN]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  isActiveRoute(path: string): boolean {
    return this.currentRoute.startsWith(path);
  }

  hasPermission(item: MenuItem): boolean {
    if (!item.roles) return true;
    return item.roles.includes(this.currentUser?.role);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
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
}
