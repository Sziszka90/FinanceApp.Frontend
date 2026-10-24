import { inject, Injectable } from '@angular/core';
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { environment } from 'src/environments/environment';
import { JOIN_GROUP_METHOD, TRANSACTIONS_MATCHED_NOTIFICATION } from 'src/models/Constants/notification.const';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private authenticationService = inject(AuthenticationService);

  private hubConnection: HubConnection | null = null;
  private notificationSubject = new Subject<void>();
  public notifications$ = this.notificationSubject.asObservable();
  private importedSubject = new Subject<string>();
  public imported$ = this.importedSubject.asObservable();
  private importErrorSubject = new Subject<{ correlationId: string; reason: string }>();
  public importErrors$ = this.importErrorSubject.asObservable();
  private connectionRetryCount = 0;
  private maxAuthRetries = 2;
  private isLoggedIn = false;
  private isStarting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  initializeAsync(): Promise<void> {
    return new Promise<void>(resolve => {
      let initialStateHandled = false;
      this.authenticationService.userLoggedIn.subscribe(loggedIn => {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          void this.startConnectionAsync();
        } else {
          this.stopConnection();
        }

        if (!initialStateHandled) {
          initialStateHandled = true;
          resolve();
        }
      });
    });
  }

  async startConnectionAsync(): Promise<void> {
    if (!this.isLoggedIn || this.isStarting || this.hubConnection?.state === HubConnectionState.Connected) {
      return;
    }

    this.isStarting = true;
    try {
      const connection = this.getOrCreateConnection();
      await connection.start();
      this.connectionRetryCount = 0;
      await this.joinUserGroup(connection);
    } catch (error) {
      console.error('SignalR: Connection or group join failed', error);
      if (this.isAuthenticationError(error)) {
        this.connectionRetryCount++;
        if (this.connectionRetryCount > this.maxAuthRetries) {
          await this.authenticationService.logoutAsync();
          return;
        }
      }
      this.scheduleReconnect();
    } finally {
      this.isStarting = false;
    }
  }

  private getOrCreateConnection(): HubConnection {
    if (this.hubConnection) {
      return this.hubConnection;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace(/\/$/, '')}/notificationHub`, {
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
        skipNegotiation: false,
        withCredentials: true
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    connection.on(TRANSACTIONS_MATCHED_NOTIFICATION, () => {
      this.notificationSubject.next();
    });

    connection.on('TransactionsImportedNotification', (correlationId: string) => {
      this.importedSubject.next(correlationId);
    });

    connection.on('TransactionsImportFailedNotification', (message: string) => {
      try {
        this.importErrorSubject.next(JSON.parse(message));
      } catch (error) {
        console.error('SignalR: Invalid PDF import failure notification', error);
      }
    });

    connection.onreconnected(async () => {
      try {
        await this.joinUserGroup(connection);
      } catch (error) {
        console.error('SignalR: Failed to rejoin user group after reconnect', error);
        this.scheduleReconnect();
      }
    });

    connection.onclose(error => {
      if (error) {
        console.error('SignalR: Connection closed', error);
      }
      if (this.isLoggedIn) {
        this.scheduleReconnect();
      }
    });

    this.hubConnection = connection;
    return connection;
  }

  private async joinUserGroup(connection: HubConnection): Promise<void> {
    const userEmail = await this.authenticationService.getUserEmail();
    await connection.invoke(JOIN_GROUP_METHOD, userEmail);
  }

  private scheduleReconnect(): void {
    if (!this.isLoggedIn || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.startConnectionAsync();
    }, 3000);
  }

  private isAuthenticationError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('401') || message.includes('Unauthorized');
  }

  stopConnection(): void {
    this.isLoggedIn = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const connection = this.hubConnection;
    this.hubConnection = null;
    this.connectionRetryCount = 0;
    if (connection) {
      void connection.stop().catch(error => {
        console.error('SignalR: Error stopping connection', error);
      });
    }
  }
}
