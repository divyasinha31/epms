import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService, CreateUserRequest, UpdateUserRequest } from '../../services/user.service';
import { User, UserRole } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {
  userForm!: FormGroup;
  isEditMode: boolean = false;
  loading: boolean = false;
  userId?: string;

  // Enums for template
  readonly UserRole = UserRole;

  // Available roles
  availableRoles = [
    { value: UserRole.DEVELOPER, label: 'Developer', description: 'Can view and manage assigned tasks' },
    { value: UserRole.PROJECT_MANAGER, label: 'Project Manager', description: 'Can manage projects and teams' },
    { value: UserRole.ADMIN, label: 'Administrator', description: 'Full system access and user management' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private userService: UserService, private notificationService: NotificationService,
    private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.createForm();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: [UserRole.DEVELOPER, Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      isActive: [true]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  private checkEditMode(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.userId && this.userId !== 'new';
    
    if (this.isEditMode) {
      // Remove password requirement for edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('confirmPassword')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.userForm.get('confirmPassword')?.updateValueAndValidity();
      
      if (this.userId) {
        this.loadUser(this.userId);
      }
    }
  }

  private loadUser(id: string): void {
    this.loading = true;
    
    this.userService.getUser(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.populateForm(user);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.notificationService.showError('Failed to load user');
          this.goBack();
        }
      });
  }

  private populateForm(user: User): void {
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: '',
      confirmPassword: ''
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      
      if (this.isEditMode && this.userId) {
        this.updateUser();
      } else {
        this.createUser();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createUser(): void {
    const formValue = this.userForm.value;
    const request: CreateUserRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      role: formValue.role,
      password: formValue.password
    };

    this.userService.createUser(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('User created successfully');
          this.goBack();
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.notificationService.showError('Failed to create user');
          this.loading = false;
        }
      });
  }

  private updateUser(): void {
    const formValue = this.userForm.value;
    const request: UpdateUserRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      role: formValue.role,
      isActive: formValue.isActive
    };

    // Only include password if it was provided
    if (formValue.password) {
      // In a real app, you'd have a separate endpoint for password changes
      console.log('Password change requested');
    }

    this.userService.updateUser(this.userId!, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('User updated successfully');
          this.goBack();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.notificationService.showError('Failed to update user');
          this.loading = false;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  // Helper methods for form validation
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters`;
      }
    }
    
    if (this.userForm.errors?.['passwordMismatch'] && fieldName === 'confirmPassword') {
      return 'Passwords do not match';
    }
    
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      role: 'Role'
    };
    
    return displayNames[fieldName] || fieldName;
  }

  getRoleDescription(role: UserRole): string {
    const roleObj = this.availableRoles.find(r => r.value === role);
    return roleObj?.description || '';
  }
}
