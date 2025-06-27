import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { User, UserRole } from '../../core/models/user.model';

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) {}

  getUsers(page: number = 1, limit: number = 10, filters?: UserFilters): Observable<PaginatedUsers> {
    // Mock data for now - will replace with real API
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@epms.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        email: 'pm@epms.com',
        firstName: 'Project',
        lastName: 'Manager',
        role: UserRole.PROJECT_MANAGER,
        isActive: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      },
      {
        id: '3',
        email: 'dev1@epms.com',
        firstName: 'John',
        lastName: 'Developer',
        role: UserRole.DEVELOPER,
        isActive: true,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
      },
      {
        id: '4',
        email: 'dev2@epms.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.DEVELOPER,
        isActive: false,
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04')
      },
      {
        id: '5',
        email: 'pm2@epms.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: UserRole.PROJECT_MANAGER,
        isActive: true,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05')
      }
    ];

    // Apply filters
    let filteredUsers = [...mockUsers];
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.role) {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }

    if (filters?.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === filters.isActive);
    }

    // Apply pagination
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const users = filteredUsers.slice(startIndex, endIndex);

    const result: PaginatedUsers = {
      users,
      total,
      page,
      limit,
      totalPages
    };

    return of(result);
    // Real API call would be:
    // return this.apiService.get<PaginatedUsers>('/users', { page, limit, ...filters });
  }

  getUser(id: string): Observable<User> {
    // Mock data
    const mockUser: User = {
      id,
      email: 'user@epms.com',
      firstName: 'Sample',
      lastName: 'User',
      role: UserRole.DEVELOPER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(mockUser);
    // Real API call would be:
    // return this.apiService.get<User>(`/users/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    // Mock data
    const newUser: User = {
      id: Date.now().toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(newUser);
    // Real API call would be:
    // return this.apiService.post<User>('/users', user);
  }

  updateUser(id: string, updates: UpdateUserRequest): Observable<User> {
    // Mock data
    const updatedUser: User = {
      id,
      email: updates.email || 'updated@epms.com',
      firstName: updates.firstName || 'Updated',
      lastName: updates.lastName || 'User',
      role: updates.role || UserRole.DEVELOPER,
      isActive: updates.isActive !== undefined ? updates.isActive : true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };

    return of(updatedUser);
    // Real API call would be:
    // return this.apiService.put<User>(`/users/${id}`, updates);
  }

  deleteUser(id: string): Observable<void> {
    // Mock data
    return of(void 0);
    // Real API call would be:
    // return this.apiService.delete<void>(`/users/${id}`);
  }

  resetPassword(id: string): Observable<void> {
    // Mock data
    return of(void 0);
    // Real API call would be:
    // return this.apiService.post<void>(`/users/${id}/reset-password`, {});
  }

  toggleUserStatus(id: string): Observable<User> {
    // Mock data - get current user and toggle status
    return this.getUser(id);
    // Real API call would be:
    // return this.apiService.patch<User>(`/users/${id}/toggle-status`, {});
  }
}