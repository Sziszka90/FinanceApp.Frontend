import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from './shared/nav-bar/nav-bar.component';
import { NotificationService } from 'src/services/notification.service';
import { ChatBubbleComponent } from './shared/chat-bubble/chat-bubble.component';
import { AuthenticationService } from 'src/services/authentication.service';

@Component({
  selector: 'root',
  imports: [
    NavBarComponent,
    RouterOutlet,
    CommonModule,
    ChatBubbleComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthenticationService);

  title = 'Finance App';
  isServer = false;

  ngOnInit(): void {
    this.authService.isAuthenticated();
  }

  testGlobalError(): void {
    throw new Error('Test error for global error handler');
  }

  testNetworkError(): void {
    fetch('http://invalid-url-that-does-not-exist.com')
      .catch(error => {
        throw new Error('Network error test: ' + error.message);
      });
  }
}
