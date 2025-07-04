import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, UserRole } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  private getStoredUser(): User | null {
    try {
      const token = localStorage.getItem(environment.tokenKey);
      const userStr = localStorage.getItem('currentUser');
      
      if (token && userStr && !this.isTokenExpired(token)) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      this.clearStoredAuth();
    }
    
    return null;
  }

  private clearStoredAuth(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/login', credentials)
      .pipe(
        map(response => {
          // Store user details and tokens in local storage
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem(environment.tokenKey, response.token);
          localStorage.setItem(environment.refreshTokenKey, response.refreshToken);
          
          // Emit the user to all subscribers
          this.currentUserSubject.next(response.user);
          
          return response;
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.clearStoredAuth();
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(environment.tokenKey);
    const user = localStorage.getItem('currentUser');
    
    return !!token && !!user && !this.isTokenExpired(token);
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUserValue;
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.currentUserValue;
    return user ? roles.includes(user.role) : false;
  }

  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem(environment.refreshTokenKey);
    
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>('/auth/refresh', { refreshToken })
      .pipe(
        map(response => {
          localStorage.setItem(environment.tokenKey, response.token);
          localStorage.setItem(environment.refreshTokenKey, response.refreshToken);
          return response;
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }
}