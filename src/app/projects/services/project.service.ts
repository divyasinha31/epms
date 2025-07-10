import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Project, ProjectStatus } from '../../core/models/project.model';
import { User } from '../../core/models/user.model';
import { NotificationIntegrationService } from '../../notifications/services/notification-integration.service';

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  managerId?: string;
}

export interface PaginatedProjects {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  managerId: string;
  teamMembers: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(
    private apiService: ApiService,
    private notificationIntegration: NotificationIntegrationService
  ) {}

  getProjects(page: number = 1, limit: number = 10, filters?: ProjectFilters): Observable<PaginatedProjects> {
    // Mock data - replace with real API call
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Mobile App Redesign',
        description: 'Complete redesign of the mobile application with new UI/UX',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        managerId: 'mgr1',
        teamMembers: ['dev1', 'dev2', 'dev3'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: '2',
        name: 'E-commerce Platform',
        description: 'Development of new e-commerce platform with payment integration',
        status: ProjectStatus.PLANNING,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-12-31'),
        managerId: 'mgr2',
        teamMembers: ['dev2', 'dev4', 'dev5'],
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-25')
      },
      {
        id: '3',
        name: 'Database Migration',
        description: 'Migration from legacy database to modern cloud solution',
        status: ProjectStatus.COMPLETED,
        startDate: new Date('2023-10-01'),
        endDate: new Date('2024-02-15'),
        managerId: 'mgr1',
        teamMembers: ['dev1', 'dev6'],
        createdAt: new Date('2023-09-15'),
        updatedAt: new Date('2024-02-15')
      }
    ];

    // Apply filters
    let filteredProjects = [...mockProjects];
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.status) {
      filteredProjects = filteredProjects.filter(project => project.status === filters.status);
    }

    if (filters?.startDate) {
      filteredProjects = filteredProjects.filter(project => 
        project.startDate >= filters.startDate!
      );
    }

    if (filters?.endDate) {
      filteredProjects = filteredProjects.filter(project => 
        project.endDate <= filters.endDate!
      );
    }

    // Apply pagination
    const total = filteredProjects.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const projects = filteredProjects.slice(startIndex, endIndex);

    const result: PaginatedProjects = {
      projects,
      total,
      page,
      limit,
      totalPages
    };

    return of(result);
  }

  getProject(id: string): Observable<Project> {
    // Mock data - replace with real API call
    const mockProject: Project = {
      id,
      name: 'Mobile App Redesign',
      description: 'Complete redesign of the mobile application with new UI/UX',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      managerId: 'mgr1',
      teamMembers: ['dev1', 'dev2', 'dev3'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-02-15')
    };

    return of(mockProject);
  }

  createProject(project: CreateProjectRequest): Observable<Project> {
    // Mock data - replace with real API call
    const newProject: Project = {
      id: Date.now().toString(),
      ...project,
      status: ProjectStatus.PLANNING,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Get team member details and send notifications
    return this.getAvailableUsers().pipe(
      map(allUsers => {
        // Filter users based on team member IDs
        const teamMembers = allUsers.filter(user => project.teamMembers.includes(user.id));
        return { project: newProject, teamMembers };
      }),
      switchMap(({ project: createdProject, teamMembers }) => {
        // Send notifications to team members
        return this.notificationIntegration.notifyProjectAssigned(createdProject, teamMembers).pipe(
          map(() => createdProject)
        );
      })
    );
  }

  updateProject(id: string, updates: UpdateProjectRequest): Observable<Project> {
    // Get the existing project first
    return this.getProject(id).pipe(
      switchMap(existingProject => {
        const updatedProject: Project = {
          ...existingProject,
          ...updates,
          updatedAt: new Date()
        };

        // Get team member details
        return this.getAvailableUsers().pipe(
          map(allUsers => {
            const teamMembers = allUsers.filter(user => updatedProject.teamMembers.includes(user.id));
            return { project: updatedProject, teamMembers, existingProject };
          }),
          switchMap(({ project, teamMembers, existingProject }) => {
            // Check what was updated and send appropriate notifications
            let updateDetails = '';
            if (updates.name && updates.name !== existingProject.name) {
              updateDetails += `Name changed to "${updates.name}". `;
            }
            if (updates.status && updates.status !== existingProject.status) {
              updateDetails += `Status changed to ${this.getStatusDisplayName(updates.status)}. `;
            }
            if (updates.endDate && updates.endDate !== existingProject.endDate) {
              updateDetails += `Deadline updated to ${updates.endDate.toDateString()}. `;
            }

            if (updateDetails) {
              return this.notificationIntegration.notifyProjectUpdated(project, teamMembers, updateDetails.trim()).pipe(
                map(() => project)
              );
            }

            return of(project);
          })
        );
      })
    );
  }

  deleteProject(id: string): Observable<void> {
    // Mock data - replace with real API call
    return of(void 0);
  }

  assignUsers(projectId: string, userIds: string[]): Observable<Project> {
    return this.getProject(projectId).pipe(
      switchMap(existingProject => {
        const updatedProject: Project = {
          ...existingProject,
          teamMembers: userIds,
          updatedAt: new Date()
        };

        // Get user details for newly assigned users
        return this.getAvailableUsers().pipe(
          map(allUsers => {
            // Find newly assigned users (not in existing team)
            const newlyAssignedUserIds = userIds.filter(userId => 
              !existingProject.teamMembers.includes(userId)
            );
            const newlyAssignedUsers = allUsers.filter(user => 
              newlyAssignedUserIds.includes(user.id)
            );
            return { project: updatedProject, newUsers: newlyAssignedUsers };
          }),
          switchMap(({ project, newUsers }) => {
            // Send notifications only to newly assigned users
            if (newUsers.length > 0) {
              return this.notificationIntegration.notifyProjectAssigned(project, newUsers).pipe(
                map(() => project)
              );
            }
            return of(project);
          })
        );
      })
    );
  }

  getAvailableUsers(): Observable<User[]> {
    // Mock data - replace with real API call
    const mockUsers: User[] = [
      {
        id: 'dev1',
        email: 'john.dev@company.com',
        firstName: 'John',
        lastName: 'Developer',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev2',
        email: 'jane.dev@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev3',
        email: 'mike.dev@company.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev4',
        email: 'sarah.dev@company.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev5',
        email: 'alex.dev@company.com',
        firstName: 'Alex',
        lastName: 'Brown',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dev6',
        email: 'lisa.dev@company.com',
        firstName: 'Lisa',
        lastName: 'Davis',
        role: 'developer' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mgr1',
        email: 'john.manager@company.com',
        firstName: 'John',
        lastName: 'Manager',
        role: 'project_manager' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mgr2',
        email: 'mary.manager@company.com',
        firstName: 'Mary',
        lastName: 'ProjectLead',
        role: 'project_manager' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return of(mockUsers);
  }

  // Helper method for status display names
  private getStatusDisplayName(status: ProjectStatus): string {
    const statusMap = {
      [ProjectStatus.PLANNING]: 'Planning',
      [ProjectStatus.IN_PROGRESS]: 'In Progress',
      [ProjectStatus.ON_HOLD]: 'On Hold',
      [ProjectStatus.COMPLETED]: 'Completed',
      [ProjectStatus.CANCELLED]: 'Cancelled'
    };
    return statusMap[status] || status;
  }

  // Method to check for upcoming deadlines and send reminders
  checkProjectDeadlines(): Observable<void> {
    return this.getProjects(1, 100).pipe(
      switchMap(response => {
        const projects = response.projects;
        const now = new Date();
        const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

        // Find projects with deadlines approaching
        const projectsWithApproachingDeadlines = projects.filter(project => {
          const endDate = new Date(project.endDate);
          return endDate <= fiveDaysFromNow && endDate > now && project.status !== ProjectStatus.COMPLETED;
        });

        if (projectsWithApproachingDeadlines.length === 0) {
          return of(void 0);
        }

        // Get all users and send deadline reminders
        return this.getAvailableUsers().pipe(
          switchMap(allUsers => {
            const notificationPromises = projectsWithApproachingDeadlines.map(project => {
              const teamMembers = allUsers.filter(user => project.teamMembers.includes(user.id));
              const daysLeft = Math.ceil((new Date(project.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              return this.notificationIntegration.notifyProjectDeadlineApproaching(project, teamMembers, daysLeft);
            });

            return forkJoin(notificationPromises).pipe(
              map(() => void 0)
            );
          })
        );
      })
    );
  }
}