import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { DashboardService, DashboardKPI } from '../../services/dashboard.service';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../core/models/user.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('projectStatusChart') projectStatusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('taskProgressChart') taskProgressChartRef!: ElementRef<HTMLCanvasElement>;

  currentUser: User | null = null;
  kpis: DashboardKPI[] = [];
  activities: any[] = [];
  loading = true;

  private projectStatusChart?: Chart;
  private taskProgressChart?: Chart;
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.projectStatusChart) {
      this.projectStatusChart.destroy();
    }
    if (this.taskProgressChart) {
      this.taskProgressChart.destroy();
    }
  }

  private loadDashboardData(): void {
    this.loading = true;

    forkJoin({
      kpis: this.dashboardService.getKPIs(),
      activities: this.dashboardService.getRecentActivities()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.activities = data.activities;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }

  private initializeCharts(): void {
    this.loadProjectStatusChart();
    this.loadTaskProgressChart();
  }

  private loadProjectStatusChart(): void {
    this.dashboardService.getProjectStatusChart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        const config: ChartConfiguration = {
          type: 'doughnut',
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        };

        this.projectStatusChart = new Chart(this.projectStatusChartRef.nativeElement, config);
      });
  }

  private loadTaskProgressChart(): void {
    this.dashboardService.getTaskProgressChart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        const config: ChartConfiguration = {
          type: 'line',
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        };

        this.taskProgressChart = new Chart(this.taskProgressChartRef.nativeElement, config);
      });
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  }
}