import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './shared/nav-bar/nav-bar.component';
import { ChatBubbleComponent } from './shared/chat-bubble/chat-bubble.component';
import { AuthenticationService } from 'src/services/authentication.service';
import { WakeupLoaderComponent } from './shared/wakeup-loader/wakeup-loader.components';
import { WakeupService } from 'src/services/wakeup.service';
import { NotificationService } from 'src/services/notification.service';
import { BaseComponent } from './shared/base-component';

@Component({
  selector: 'root',
  imports: [
    NavBarComponent,
    RouterOutlet,
    ChatBubbleComponent,
    WakeupLoaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent extends BaseComponent implements OnInit {
  private authService = inject(AuthenticationService);
  private wakeupService = inject(WakeupService);
  private notificationService = inject(NotificationService);

  title = 'Finance App';
  isServer = false;

  showWakeupLoader = false;
  showApp = false;
  showChat = false;

  async ngOnInit(): Promise<void> {
    this.wakeupService.showWakeupLoader$.subscribe(show => {
      this.showWakeupLoader = show;
    });

    this.wakeupService.showApp$.subscribe(show => {
      this.showApp = show;
    });

    this.authService.userLoggedIn.subscribe(loggedIn => {
      this.showChat = loggedIn;
    });

    await this.wakeupService.wakeup();
    await this.notificationService.initializeAsync();
    await this.authService.isAuthenticatedAsync();
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
