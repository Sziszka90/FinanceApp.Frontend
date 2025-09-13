import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ErrorModalComponent } from 'src/app/shared/error-modal/error-modal.component';
import { WakeupApiService } from './wakeup.api.service';

@Injectable({ providedIn: 'root' })
export class WakeupService {
  private wakeupApiService = inject(WakeupApiService);
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
    const delays = Array(5).fill(15000);
    try {
      let response: unknown = null;
      let shouldRetry = true;
      for (let i = 0; i < 5 && shouldRetry; i++) {
        try {
          response = await firstValueFrom(this.wakeupApiService.wakeup());
          break;
        } catch (error) {
          if (i === 4) {
            this.dialog.open(ErrorModalComponent, {
              data: { message: 'Backend services are not available. Retry later.' }
            });
            shouldRetry = false;
            break;
          } else {
            await new Promise(res => setTimeout(res, delays[i]));
          }
        }
      }
      this.showApp = (response as any)?.status === 200;
    } finally {
      this.showWakeupLoader = false;
    }
  }
}
