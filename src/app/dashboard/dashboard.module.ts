import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Routing
import { DashboardRoutingModule } from './dashboard-routing.module';

// Components
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';

// Services
import { DashboardService } from './services/dashboard.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    DashboardComponent,
    KpiCardComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [
    DashboardService
  ]
})
export class DashboardModule { }