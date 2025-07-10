import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  sidebarOpen: boolean = true;
  isMobile: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    console.log('Layout component initialized'); // Debug log
    
    // Get current user
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('Layout received user:', user); // Debug log
        this.currentUser = user;
      });

    this.checkMobile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.sidebarOpen = false;
    } else {
      this.sidebarOpen = true;
    }
    console.log('Mobile check:', { isMobile: this.isMobile, sidebarOpen: this.sidebarOpen }); // Debug log
  }

  onToggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    console.log('Sidebar toggled:', this.sidebarOpen); // Debug log
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}
