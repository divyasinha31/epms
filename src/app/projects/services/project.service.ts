import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Project, ProjectStatus } from '../../core/models/project.model';
import { User } from '../../core/models/user.model';

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

  constructor(private apiService: ApiService) {}

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
      },
      {
        id: '4',
        name: 'Security Audit',
        description: 'Comprehensive security audit and vulnerability assessment',
        status: ProjectStatus.ON_HOLD,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-30'),
        managerId: 'mgr3',
        teamMembers: ['dev7', 'dev8'],
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-02-10')
      },
      {
        id: '5',
        name: 'API Development',
        description: 'RESTful API development for third-party integrations',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-05-20'),
        managerId: 'mgr2',
        teamMembers: ['dev3', 'dev5', 'dev9'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-20')
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
    // Real API call would be:
    // return this.apiService.get<PaginatedProjects>('/projects', { page, limit, ...filters });
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
    // Real API call would be:
    // return this.apiService.get<Project>(`/projects/${id}`);
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

    return of(newProject);
    // Real API call would be:
    // return this.apiService.post<Project>('/projects', project);
  }

  updateProject(id: string, updates: UpdateProjectRequest): Observable<Project> {
    // Mock data - replace with real API call
    const updatedProject: Project = {
      id,
      name: updates.name || 'Updated Project',
      description: updates.description || 'Updated description',
      status: updates.status || ProjectStatus.IN_PROGRESS,
      startDate: updates.startDate || new Date(),
      endDate: updates.endDate || new Date(),
      managerId: updates.managerId || 'mgr1',
      teamMembers: updates.teamMembers || [],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date()
    };

    return of(updatedProject);
    // Real API call would be:
    // return this.apiService.put<Project>(`/projects/${id}`, updates);
  }

  deleteProject(id: string): Observable<void> {
    // Mock data - replace with real API call
    return of(void 0);
    // Real API call would be:
    // return this.apiService.delete<void>(`/projects/${id}`);
  }

  assignUsers(projectId: string, userIds: string[]): Observable<Project> {
    // Mock data - replace with real API call
    const updatedProject: Project = {
      id: projectId,
      name: 'Updated Project',
      description: 'Project with new team members',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date(),
      endDate: new Date(),
      managerId: 'mgr1',
      teamMembers: userIds,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date()
    };

    return of(updatedProject);
    // Real API call would be:
    // return this.apiService.patch<Project>(`/projects/${projectId}/assign`, { userIds });
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
        id: 'mgr1',
        email: 'mike.pm@company.com',
        firstName: 'Mike',
        lastName: 'Manager',
        role: 'project_manager' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return of(mockUsers);
    // Real API call would be:
    // return this.apiService.get<User[]>('/users');
  }
}