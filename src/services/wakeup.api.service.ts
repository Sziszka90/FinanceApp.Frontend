import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WakeupApiService {
  private http = inject(HttpClient);

  wakeup(): Observable<HttpResponse<Object>> {
    return this.http.post<Object>(`${environment.apiUrl}/api/v1/wakeup`, {}, { observe: 'response' });
  }
}
