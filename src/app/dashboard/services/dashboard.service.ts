import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface DashboardKPI {
  id: string;
  title: string;
  value: number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[] | string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private apiService: ApiService) { }

  getKPIs(): Observable<DashboardKPI[]> {
    // Mock data - replace with real API call
    const kpis: DashboardKPI[] = [
      {
        id: 'projects',
        title: 'Total Projects',
        value: 12,
        icon: 'work',
        color: '#1976d2',
        trend: { value: 2, isPositive: true }
      },
      {
        id: 'active-users',
        title: 'Active Users',
        value: 25,
        icon: 'people',
        color: '#388e3c',
        trend: { value: 5, isPositive: true }
      },
      {
        id: 'overdue-tasks',
        title: 'Overdue Tasks',
        value: 3,
        icon: 'warning',
        color: '#f57c00',
        trend: { value: 1, isPositive: false }
      },
      {
        id: 'completed-tasks',
        title: 'Completed Tasks',
        value: 89,
        icon: 'check_circle',
        color: '#4caf50',
        trend: { value: 12, isPositive: true }
      }
    ];

    return of(kpis);
    // Real API call would be:
    // return this.apiService.get<DashboardKPI[]>('/dashboard/kpis');
  }

  getProjectStatusChart(): Observable<ChartData> {
    // Mock data - replace with real API call
    const chartData: ChartData = {
      labels: ['Planning', 'In Progress', 'On Hold', 'Completed'],
      datasets: [{
        label: 'Projects by Status',
        data: [3, 5, 1, 3],
        backgroundColor: [ '#2196f3', '#ff9800', '#f44336', '#4caf50' ]
      }]
    };

    return of(chartData);
    // Real API call would be:
    // return this.apiService.get<ChartData>('/dashboard/project-status-chart');
  }

  getTaskProgressChart(): Observable<ChartData> {
    // Mock data - replace with real API call
    const chartData: ChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Tasks Completed',
          data: [12, 19, 15, 25, 22, 30],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2
        },
        {
          label: 'Tasks Created',
          data: [15, 25, 18, 28, 26, 35],
          borderColor: '#388e3c',
          backgroundColor: 'rgba(56, 142, 60, 0.1)',
          borderWidth: 2
        }
      ]
    };

    return of(chartData);
    // Real API call would be:
    // return this.apiService.get<ChartData>('/dashboard/task-progress-chart');
  }

  getRecentActivities(): Observable<any[]> {
    // Mock data - replace with real API call
    const activities = [
      {
        id: 1,
        type: 'project_created',
        message: 'New project "Mobile App Redesign" created',
        user: 'John Doe',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        icon: 'add_circle'
      },
      {
        id: 2,
        type: 'task_completed',
        message: 'Task "Setup authentication" marked as completed',
        user: 'Jane Smith',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        icon: 'check_circle'
      },
      {
        id: 3,
        type: 'user_assigned',
        message: 'Mike Johnson assigned to "Database Migration" project',
        user: 'Admin User',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        icon: 'person_add'
      }
    ];

    return of(activities);
    // Real API call would be:
    // return this.apiService.get<any[]>('/dashboard/recent-activities');
  }
}
