import { inject, Injectable } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { JOIN_GROUP_METHOD, TRANSACTIONS_MATCHED_NOTIFICATION } from 'src/models/Constants/notification.const';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private authenticationService = inject(AuthenticationService);

  private hubConnection: HubConnection | null = null;
  private notificationSubject = new BehaviorSubject<string | null>(null);
  public notifications$ = this.notificationSubject.asObservable();
  private connectionRetryCount = 0;
  private maxAuthRetries = 2;

  initializeAsync(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.authenticationService.userLoggedIn.subscribe(async (loggedIn) => {
        if (loggedIn && !this.hubConnection) {
          await this.startConnectionAsync();
          resolve();
        } else {
          if (!loggedIn) {
            this.stopConnection();
          }
          resolve();
        }
      });
    });
  }

  async startConnectionAsync(): Promise<void> {
    if (this.hubConnection) {
      this.stopConnection();
    }

    if (this.connectionRetryCount === 0) {
      console.warn('SignalR: Starting new connection attempt with authentication passed');
    } else {
      console.warn(`SignalR: Retry attempt ${this.connectionRetryCount + 1}/${this.maxAuthRetries + 1}`);
    }

    setTimeout(async () => {
      await this.attemptConnectionAsync();
    }, this.connectionRetryCount === 0 ? 500 : 100);
  }

  private async attemptConnectionAsync(): Promise<void> {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`https://www.financeapp.fun/notificationHub`, {
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
        skipNegotiation: false,
        withCredentials: true
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Debug)
      .build();

    this.hubConnection.on(TRANSACTIONS_MATCHED_NOTIFICATION, (message) => {
      this.notificationSubject.next(message);
    });

    this.hubConnection.onclose(async (error) => {
      if (error) {
        console.error('SignalR Connection closed with error:', error);
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          console.warn('SignalR: Connection closed due to authentication error');
          if (this.connectionRetryCount < this.maxAuthRetries) {
            this.connectionRetryCount++;
            console.warn(`SignalR: Will retry connection (attempt ${this.connectionRetryCount}/${this.maxAuthRetries})`);
            setTimeout(async () => {
              await this.startConnectionAsync();
            }, 3000);
          } else {
            console.error('SignalR: Max retries reached, logging out user');
            await this.authenticationService.logoutAsync();
          }
        }
      }
    });

    this.hubConnection.start()
      .then(async () => {
        console.warn('SignalR: Connection established successfully');
        console.warn(`SignalR: Connection state: ${this.hubConnection?.state}`);
        console.warn(`SignalR: Connection details:`, {
          baseUrl: this.hubConnection?.baseUrl,
          connectionId: this.hubConnection?.connectionId
        });

        this.connectionRetryCount = 0;
        if (this.hubConnection) {
          const userEmail = await this.authenticationService.getUserEmail();
          return this.hubConnection.invoke(JOIN_GROUP_METHOD, userEmail);
        }
        return Promise.resolve();
      })
      .then(() => {
        console.warn('SignalR: Successfully joined user group');
      })
      .catch(async err => {
        console.error('SignalR Connection Error:', err);

        if (err.message) {
          if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            console.warn('SignalR: Authentication failed on attempt', this.connectionRetryCount + 1);

            if (this.connectionRetryCount < this.maxAuthRetries) {
              this.connectionRetryCount++;
              console.warn(`SignalR: Retrying connection in 3 seconds (attempt ${this.connectionRetryCount}/${this.maxAuthRetries})`);

              setTimeout(async () => {
                await this.startConnectionAsync();
              }, 3000);
              return;
            } else {
              console.error('SignalR: Max auth retries reached, logging out user');
              await this.authenticationService.logoutAsync();
              return;
            }
          }

          if (err.message.includes('Unable to connect to the server')) {
            console.error('SignalR: Server unavailable. This is normal if the backend is not running.');
            return;
          }

          if (err.message.includes('WebSocket failed to connect')) {
            console.error('SignalR: WebSocket connection failed. Server might not be running or endpoint incorrect.');
            return;
          }
        }

        console.error('SignalR: Unexpected connection error, will retry automatically');
      });
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .catch(err => {
          console.error('SignalR: Error stopping connection:', err);
        })
        .finally(() => {
          this.hubConnection = null;
          this.connectionRetryCount = 0;
        });
    }
  }
}
