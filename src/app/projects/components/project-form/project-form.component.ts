import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProjectService, CreateProjectRequest, UpdateProjectRequest } from '../../services/project.service';
import { Project, ProjectStatus } from '../../../core/models/project.model';
import { User, UserRole } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  projectForm!: FormGroup;
  dateRangeGroup!: FormGroup;
  isEditMode = false;
  loading = false;
  projectId?: string;

  availableManagers: User[] = [];
  availableDevelopers: User[] = [];
  selectedTeamMembers: User[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadUsers();
    this.checkEditMode();
    this.setupTeamMembersWatcher();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    // Create separate date range group
    this.dateRangeGroup = this.fb.group({
      start: ['', Validators.required],
      end: ['', Validators.required]
    }, { validators: this.dateRangeValidator });

    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      status: [ProjectStatus.PLANNING],
      managerId: ['', Validators.required],
      dateRange: this.dateRangeGroup, // Add the date range group
      teamMembers: [[]]
    });
  }

  private dateRangeValidator(control: AbstractControl): any {
    const start = control.get('start')?.value;
    const end = control.get('end')?.value;
    
    if (start && end && new Date(end) <= new Date(start)) {
      return { dateRange: true };
    }
    
    return null;
  }

  private loadUsers(): void {
    this.projectService.getAvailableUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.availableManagers = users.filter(user => 
          user.role === UserRole.PROJECT_MANAGER || user.role === UserRole.ADMIN
        );
        this.availableDevelopers = users.filter(user => 
          user.role === UserRole.DEVELOPER
        );
      });
  }

  private checkEditMode(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.projectId && this.projectId !== 'new';
    
    if (this.isEditMode && this.projectId) {
      this.loadProject(this.projectId);
    }
  }

  private loadProject(id: string): void {
    this.loading = true;
    
    this.projectService.getProject(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.populateForm(project);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading project:', error);
          this.notificationService.showError('Failed to load project');
          this.goBack();
        }
      });
  }

  private populateForm(project: Project): void {
    this.projectForm.patchValue({
      name: project.name,
      description: project.description,
      status: project.status,
      managerId: project.managerId,
      teamMembers: project.teamMembers
    });

    this.dateRangeGroup.patchValue({
      start: project.startDate,
      end: project.endDate
    });
  }

  private setupTeamMembersWatcher(): void {
    this.projectForm.get('teamMembers')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(memberIds => {
        this.selectedTeamMembers = this.availableDevelopers.filter(user => 
          memberIds.includes(user.id)
        );
      });
  }

  removeTeamMember(userId: string): void {
    const currentMembers = this.projectForm.get('teamMembers')?.value || [];
    const updatedMembers = currentMembers.filter((id: string) => id !== userId);
    this.projectForm.patchValue({ teamMembers: updatedMembers });
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      this.loading = true;
      
      if (this.isEditMode && this.projectId) {
        this.updateProject();
      } else {
        this.createProject();
      }
    }
  }

  private createProject(): void {
    const formValue = this.projectForm.value;
    const dateRange = this.dateRangeGroup.value;
  
    const request: CreateProjectRequest = {
      name: formValue.name,
      description: formValue.description,
      startDate: dateRange.start,
      endDate: dateRange.end,
      managerId: formValue.managerId,
      teamMembers: formValue.teamMembers
    };

    this.projectService.createProject(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.notificationService.showSuccess('Project created successfully');
          this.router.navigate(['/projects', project.id]);
        },
        error: (error) => {
          console.error('Error creating project:', error);
          this.notificationService.showError('Failed to create project');
          this.loading = false;
        }
      });
  }

  private updateProject(): void {
    const formValue = this.projectForm.value;
    const dateRange = this.dateRangeGroup.value;
  
    const request: UpdateProjectRequest = {
      name: formValue.name,
      description: formValue.description,
      startDate: dateRange.start,
      endDate: dateRange.end,
      managerId: formValue.managerId,
      teamMembers: formValue.teamMembers
    };

    this.projectService.updateProject(this.projectId!, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.notificationService.showSuccess('Project updated successfully');
          this.router.navigate(['/projects', project.id]);
        },
        error: (error) => {
          console.error('Error updating project:', error);
          this.notificationService.showError('Failed to update project');
          this.loading = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}