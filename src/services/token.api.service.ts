import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ValidateTokenResponse } from 'src/models/UserDtos/validate-toke-response.dto';

@Injectable({
  providedIn: 'root'
})
export class TokenApiService {

  // API base URL
  private apiUrl = environment?.apiUrl ?? '';

  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {
    // Initialize HTTP client for API calls
  }

  verifyToken(token: string): Observable<ValidateTokenResponse> {
    return this.http.post<ValidateTokenResponse>(`${this.apiUrl}/api/v1/token/validate`, { Token : token });
  }
}
