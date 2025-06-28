import { Component, OnInit } from '@angular/core';
import { User } from './core/models/user.model';
import { AuthService } from './auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentUser: User | null = null;
  isLoggedIn = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      
      console.log('App component auth state:', { user, isLoggedIn: this.isLoggedIn }); // Debug log
      
      // Redirect to login if not authenticated
      if (!this.isLoggedIn && !this.router.url.includes('/auth')) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  // Debug mode
  forceLogout(): void {
    localStorage.clear();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
