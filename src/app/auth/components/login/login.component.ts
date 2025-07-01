import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading: boolean;
  submitted: boolean;
  returnUrl!: string;
  hidePassword: boolean;

  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router,
    private authService: AuthService, private notificationService: NotificationService) {

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
    this.loading = false;
    this.submitted = false;
    this.hidePassword = true;
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    
    this.authService.login(this.loginForm.value)
      .subscribe({ 
        next: (response) => {
          this.notificationService.showSuccess('Login successful!');
          this.router.navigate(['/dashboard']);
          this.loading = false;
        }, 
        error: (error) => {
          console.error('Login error:', error);
          this.notificationService.showError('Invalid email or password');
          this.loading = false;
        }
      });
  }

  hasError(fieldName: string, errorType: string): boolean {
    return this.loginForm.get(fieldName)?.hasError(errorType) && 
      (this.loginForm.get(fieldName)?.dirty || this.submitted) || false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    let message: string = '';

    if (field?.errors && (field.dirty || this.submitted)) {
      if (field.errors['required']) {
        message = `${this.getFieldDisplayName(fieldName)} is required`;
      }

      if (field.errors['email']) {
        message = 'Please enter a valid email address';
      }

      if (field.errors['minlength']) {
        message = `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }

    return message;
  }

  private getFieldDisplayName(fieldName: string): string {
    switch (fieldName) {
      case 'email': return 'Email';
      case 'password': return 'Password';
      default: return fieldName;
    }
  }
}