import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationApiService {
  private http = inject(HttpClient);
  private apiUrl = environment?.apiUrl ?? '';

  login(loginRequestDto: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.apiUrl}/api/v1/auth/login`, loginRequestDto);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/v1/auth/logout`, {});
  }
}
