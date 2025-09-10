import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { timeout, catchError, retry } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ErrorModalComponent } from 'src/app/shared/error-modal/error-modal.component';

@Injectable({ providedIn: 'root' })
export class WakeupService {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  private _showApp = new BehaviorSubject<boolean>(false);
  showApp$ = this._showApp.asObservable();

  set showApp(value: boolean) {
    this._showApp.next(value);
  }

  private _showWakeupLoader = new BehaviorSubject<boolean>(true);
  showWakeupLoader$ = this._showWakeupLoader.asObservable();

  set showWakeupLoader(value: boolean) {
    this._showWakeupLoader.next(value);
  }

  async wakeup() {
    const delays = [15000, 15000, 15000, 15000, 15000, 15000, 15000];

    try {
      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/v1/wakeup`, {}, { observe: 'response' }).pipe(
          timeout(180000),
          retry({
            count: 7,
            delay: (error, retryCount) => {
              if (error.status === 503) {
                return throwError(() => new Error('Backend services are not available. Retry later.'));
              }
              return of(delays[retryCount - 1]);
            }
          }),
          catchError(() => {
            this.dialog.open(ErrorModalComponent, {
              data: { message: 'Backend services are not available. Retry later.' }
            });
            return throwError(() => new Error('Backend services are not available. Retry later.'));
          })
        ));
      this.showApp = response.status === 200;
    } finally {
      this.showWakeupLoader = false;
    }
  }
}
