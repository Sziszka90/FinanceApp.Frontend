import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { ValidateTokenResponse } from 'src/models/UserDtos/validate-toke-response.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationApiService {

   // API base URL
  private apiUrl = environment?.apiUrl ?? '';

  constructor(private http: HttpClient) { }

  login(loginRequestDto: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.apiUrl}/api/auth/login`, loginRequestDto);
  }

  validateToken(token: string): Observable<ValidateTokenResponse> {
    return this.http.post<ValidateTokenResponse>(`${this.apiUrl}/api/auth/validate-token?token=${token}`, {});
  }
}
