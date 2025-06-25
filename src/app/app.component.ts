import { Component, OnInit } from '@angular/core';
import { NotificationService } from './core/services/notification.service';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Enterprise Project Management System';

  constructor(private notificationService: NotificationService, private apiService: ApiService) { }

  ngOnInit(): void {
    // Test notification service
    setTimeout(() => {
      this.notificationService.showSuccess('EPMS Application Started Successfully!');
    }, 1000);
  }

  testNotifications(): void {
    this.notificationService.showInfo('This is an info message');
    setTimeout(() => this.notificationService.showWarning('This is a warning'), 1000);
    setTimeout(() => this.notificationService.showError('This is an error'), 2000);
    setTimeout(() => this.notificationService.showSuccess('This is success'), 3000);
  }
}
