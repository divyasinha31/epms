import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
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
  isInitialized = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.initializeAuthState();
    
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateAuthState();
      });
      
    window.addEventListener('resize', () => this.checkMobile());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', () => this.checkMobile());
  }

  private initializeAuthState(): void {
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.updateAuthStateFromUser(user);
      });
    
    this.updateAuthState();
  }

  private updateAuthState(): void {
    const token = localStorage.getItem('epms_token');
    const storedUser = localStorage.getItem('currentUser');
    
    if (token && storedUser && this.authService.isAuthenticated()) {
      try {
        const user = JSON.parse(storedUser);
        this.updateAuthStateFromUser(user);
        
        if (!this.authService.currentUserValue) {
          this.authService['currentUserSubject'].next(user);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearAuthState();
      }
    } else {
      this.clearAuthState();
    }
  }

  private updateAuthStateFromUser(user: User | null): void {
    this.currentUser = user;
    this.isLoggedIn = !!user;
    this.isInitialized = true;
  }

  private clearAuthState(): void {
    this.currentUser = null;
    this.isLoggedIn = false;
    this.isInitialized = true;
    
    localStorage.removeItem('currentUser');
    localStorage.removeItem('epms_token');
    localStorage.removeItem('epms_refresh_token');
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.sidebarOpen = false;
    } else {
      this.sidebarOpen = true;
    }
  }

  get currentRoute(): string {
    return this.router.url;
  }

  get shouldShowAuthLayout(): boolean {
    return this.isInitialized && this.isLoggedIn && !this.currentRoute.includes('/auth');
  }

  get shouldShowLoginLayout(): boolean {
    return this.isInitialized && (!this.isLoggedIn || this.currentRoute.includes('/auth'));
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}