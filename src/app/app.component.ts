import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from './shared/nav-bar/nav-bar.component';
import { NotificationService } from 'src/services/notification.service';

@Component({
    selector: 'root',
    imports: [
        NavBarComponent,
        RouterOutlet,
        CommonModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
})
export class AppComponent {
  private notificationService = inject(NotificationService);

  title: string = "Finance App"
  isServer: boolean = false;

  // Test method for global error handler (remove in production)
  testGlobalError(): void {
    throw new Error('Test error for global error handler');
  }

  // Test method for network error (remove in production)
  testNetworkError(): void {
    // This would trigger a network error
    fetch('http://invalid-url-that-does-not-exist.com')
      .catch(error => {
        throw new Error('Network error test: ' + error.message);
      });
  }
}
