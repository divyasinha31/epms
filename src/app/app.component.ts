import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { User } from './core/models/user.model';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoggedIn = false;
  sidebarOpen = true;
  isMobile = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {
    this.checkMobile();
  }

  ngOnInit(): void {
    console.log('App component initializing...');
    
    // Check if user is already logged in
    this.checkInitialAuthState();
    
    // Listen to auth changes
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('Auth state changed:', user);
        this.currentUser = user;
        this.isLoggedIn = !!user;
        
        // Handle routing
        this.handleAuthRouting();
      });
      
    // Check mobile on resize
    window.addEventListener('resize', () => this.checkMobile());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', () => this.checkMobile());
  }

  private checkInitialAuthState(): void {
    const token = localStorage.getItem('epms_token');
    const storedUser = localStorage.getItem('currentUser');
    
    console.log('Initial auth check:', { hasToken: !!token, hasUser: !!storedUser });
    
    if (token && storedUser && this.authService.isAuthenticated()) {
      try {
        const user = JSON.parse(storedUser);
        this.authService['currentUserSubject'].next(user);
        console.log('Restored user session:', user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.forceLogout();
      }
    } else {
      console.log('No valid session found');
      this.forceLogout();
    }
  }

  private handleAuthRouting(): void {
    const currentUrl = this.router.url;
    
    if (this.isLoggedIn) {
      if (currentUrl.includes('/auth') || currentUrl === '/') {
        console.log('Redirecting to dashboard');
        this.router.navigate(['/dashboard']);
      }
    } else {
      if (!currentUrl.includes('/auth')) {
        console.log('Redirecting to login');
        this.router.navigate(['/auth/login']);
      }
    }
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.sidebarOpen = false;
    } else {
      this.sidebarOpen = true;
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    console.log('Sidebar toggled:', this.sidebarOpen);
  }

  forceLogout(): void {
    console.log('Force logout triggered');
    localStorage.clear();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}