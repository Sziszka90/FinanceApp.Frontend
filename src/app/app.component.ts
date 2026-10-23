import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './shared/nav-bar/nav-bar.component';
import { AuthenticationService } from 'src/services/authentication.service';
import { WakeupLoaderComponent } from './shared/wakeup-loader/wakeup-loader.components';
import { WakeupService } from 'src/services/wakeup.service';
import { NotificationService } from 'src/services/notification.service';
import { BaseComponent } from './shared/base-component';
import { PdfImportJobsService } from 'src/services/pdf-import-jobs.service';

@Component({
  selector: 'root',
  imports: [NavBarComponent, RouterOutlet, WakeupLoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class AppComponent extends BaseComponent implements OnInit {
  private authService = inject(AuthenticationService);
  private wakeupService = inject(WakeupService);
  private notificationService = inject(NotificationService);
  private pdfImportJobs = inject(PdfImportJobsService);

  title = 'Finance App';
  isServer = false;

  showWakeupLoader = signal(false);
  showApp = signal(false);

  async ngOnInit(): Promise<void> {
    this.notificationService.imported$.subscribe(correlationId => this.pdfImportJobs.complete(correlationId));
    this.notificationService.importErrors$.subscribe(({ correlationId, reason }) => this.pdfImportJobs.fail(correlationId, reason));

    this.wakeupService.showWakeupLoader$.subscribe(show => {
      this.showWakeupLoader.set(show);
    });

    this.wakeupService.showApp$.subscribe(show => {
      this.showApp.set(show);
    });

    await this.wakeupService.wakeup();
    await this.notificationService.initializeAsync();
    await this.authService.isAuthenticatedAsync();
  }

  testGlobalError(): void {
    throw new Error('Test error for global error handler');
  }

  testNetworkError(): void {
    fetch('http://invalid-url-that-does-not-exist.com').catch(error => {
      throw new Error('Network error test: ' + error.message);
    });
  }
}
