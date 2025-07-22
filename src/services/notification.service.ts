import { inject, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { JOIN_GROUP_METHOD, TRANSACTIONS_MATCHED_NOTIFICATION } from 'src/models/Constants/notification.const';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private authenticationService = inject(AuthenticationService);

  private hubConnection: HubConnection | null = null;
  private notificationSubject = new BehaviorSubject<string | null>(null);
  public notifications$ = this.notificationSubject.asObservable();

  constructor() {
    if(this.authenticationService.isAuthenticated()) {
      this.startConnection();
    } else {
      this.stopConnection();
    }

    this.authenticationService.userLoggedIn.subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this.startConnection();
      } else {
        this.stopConnection();
      }
    });
  }

  startConnection(): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`/notificationHub`)
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.start()
      .then(() => {
        if (this.hubConnection) {
          this.hubConnection.invoke(JOIN_GROUP_METHOD, this.authenticationService.getUserId());
        }
      })
      .catch(err => console.error('SignalR Connection Error:', err));

    if (this.hubConnection) {
      this.hubConnection.on(TRANSACTIONS_MATCHED_NOTIFICATION, (message) => {
        this.notificationSubject.next(message);
      });
    }
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }
}
