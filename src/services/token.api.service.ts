import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ValidateTokenResponse } from 'src/models/UserDtos/validate-toke-response.dto';
import { ValidateTokenRequest } from 'src/models/ValidateTokenDtos/validate-token-request.dto';

@Injectable({
  providedIn: 'root'
})
export class TokenApiService {
  private http = inject(HttpClient);

  private readonly apiUrl = environment?.apiUrl ?? '';

  verifyToken(validateTokenRequest: ValidateTokenRequest): Observable<ValidateTokenResponse> {
    return this.http.post<ValidateTokenResponse>(`${this.apiUrl}/api/v1/token/validate`, validateTokenRequest);
  }
}
