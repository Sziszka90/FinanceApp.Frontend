import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { environment } from '../environments/environment';
import { BehaviorSubject, catchError, firstValueFrom, Observable, throwError, timeout } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ErrorModalComponent } from 'src/app/shared/error-modal/error-modal.component';

@Injectable({ providedIn: 'root' })
export class WakeupService {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  private _showWakeupLoader = new BehaviorSubject<boolean>(false);
  showWakeupLoader$ = this._showWakeupLoader.asObservable();

  private _showApp = new BehaviorSubject<boolean>(false);
  showApp$ = this._showApp.asObservable();

  set showWakeupLoader(value: boolean) {
    this._showWakeupLoader.next(value);
  }

  set showApp(value: boolean) {
    this._showApp.next(value);
  }

  async wakeup() {
    try {
      this.showWakeupLoader = true;
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/wakeup`, {}).pipe(
          timeout(60000),
          catchError((err) => {
            this.showWakeupLoader = false;
            this.dialog.open(ErrorModalComponent, {
              data: {
                message: 'The backend service is currently unavailable. Please try again later.'
              }
            });
            return throwError(() => new Error('Backend wakeup failed or timed out'));
          })
        )
      );
      this.showApp = true;
    } finally {
      this.showWakeupLoader = false;
    }
  }
}
