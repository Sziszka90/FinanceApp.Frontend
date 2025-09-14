import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WakeupApiService {
  private http = inject(HttpClient);

  wakeup(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/v1/wakeup`, {});
  }
}
