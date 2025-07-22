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
}
