import { Component, Input } from '@angular/core';
import { DashboardKPI } from '../../services/dashboard.service';

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss']
})
export class KpiCardComponent {
  @Input() kpi!: DashboardKPI;
}
