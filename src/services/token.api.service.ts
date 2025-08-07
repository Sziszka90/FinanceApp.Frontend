import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ValidateTokenResponse } from 'src/models/UserDtos/validate-toke-response.dto';

@Injectable({
  providedIn: 'root'
})
export class TokenApiService {

  private readonly apiUrl = environment?.apiUrl ?? '';

  constructor(private http: HttpClient) { }

  verifyToken(token: string): Observable<ValidateTokenResponse> {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return throwError(() => new Error('Token is required'));
    }

    return this.http.post<ValidateTokenResponse>(`${this.apiUrl}/api/v1/token/validate`, { Token: token });
  }
}
