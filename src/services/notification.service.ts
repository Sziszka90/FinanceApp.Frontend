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

  constructor() {
    setTimeout(() => {
      if (this.authenticationService.isAuthenticated() && this.authenticationService.validateToken()) {
        this.startConnection();
      }
    }, 3000);

    this.authenticationService.userLoggedIn.subscribe((isLoggedIn) => {
      if (isLoggedIn && this.authenticationService.validateToken()) {
        setTimeout(() => {
          this.startConnection();
        }, 1000);
      } else {
        this.stopConnection();
      }
    });
  }

  startConnection(): void {
    if (this.hubConnection) {
      this.stopConnection();
    }

    const token = this.authenticationService.getToken();
    if (!token) {
      console.warn('SignalR: No token available, cannot establish connection');
      return;
    }

    const isTokenValid = this.authenticationService.validateToken();
    if (!isTokenValid) {
      console.warn('SignalR: Token validation failed, cannot establish connection');
      return;
    }

    if (token.trim() === '') {
      console.warn('SignalR: Token is empty, cannot establish connection');
      return;
    }

    if (this.connectionRetryCount === 0) {
      console.warn('SignalR: Starting new connection attempt with token validation passed');
    } else {
      console.warn(`SignalR: Retry attempt ${this.connectionRetryCount + 1}/${this.maxAuthRetries + 1}`);
    }

    setTimeout(() => {
      this.attemptConnection(token);
    }, this.connectionRetryCount === 0 ? 500 : 100);
  }

  private attemptConnection(token: string): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`https://localhost:65030/notificationHub`, {
        accessTokenFactory: () => {
          return token;
        },
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
        skipNegotiation: false,
        withCredentials: true
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext: { previousRetryCount: number; elapsedMilliseconds: number }) => {
          if (retryContext.previousRetryCount >= 5) {
            console.error('SignalR: Max retries reached, stopping reconnection attempts');
            return null;
          }
          const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          const jitter = Math.random() * 1000;
          return delay + jitter;
        }
      })
      .configureLogging(LogLevel.Warning)
      .build();

    this.hubConnection.on(TRANSACTIONS_MATCHED_NOTIFICATION, (message) => {
      this.notificationSubject.next(message);
    });

    this.hubConnection.onclose((error) => {
      if (error) {
        console.error('SignalR Connection closed with error:', error);
      }
    });

    this.hubConnection.onreconnecting((error) => {
      console.warn('SignalR Reconnecting:', error);
    });

    this.hubConnection.onreconnected(() => {
      if (this.hubConnection) {
        this.hubConnection.invoke(JOIN_GROUP_METHOD, this.authenticationService.getUserId())
          .catch(err => console.error('SignalR: Failed to rejoin group after reconnection:', err));
      }
    });

    this.hubConnection.start()
      .then(() => {
        console.warn('SignalR: Connection established successfully');
        this.connectionRetryCount = 0;
        if (this.hubConnection) {
          return this.hubConnection.invoke(JOIN_GROUP_METHOD, this.authenticationService.getUserId());
        }
        return Promise.resolve();
      })
      .then(() => {
        console.warn('SignalR: Successfully joined user group');
      })
      .catch(err => {
        console.error('SignalR Connection Error:', err);

        if (err.message) {
          if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            console.warn('SignalR: Authentication failed on attempt', this.connectionRetryCount + 1);

            if (this.connectionRetryCount < this.maxAuthRetries) {
              this.connectionRetryCount++;
              console.warn(`SignalR: Retrying connection in 3 seconds (attempt ${this.connectionRetryCount}/${this.maxAuthRetries})`);

              setTimeout(() => {
                if (this.authenticationService.isAuthenticated() && this.authenticationService.validateToken()) {
                  this.startConnection();
                } else {
                  console.error('SignalR: Token invalid on retry, logging out user');
                  this.authenticationService.logout();
                }
              }, 3000);
              return;
            } else {
              console.error('SignalR: Max auth retries reached, logging out user');
              this.authenticationService.logout();
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

  resetAndReconnect(): void {
    console.warn('SignalR: Resetting connection state and attempting fresh connection');
    this.connectionRetryCount = 0;
    this.stopConnection();

    setTimeout(() => {
      if (this.authenticationService.isAuthenticated() && this.authenticationService.validateToken()) {
        this.startConnection();
      }
    }, 1000);
  }

  getRetryCount(): number {
    return this.connectionRetryCount;
  }
}
