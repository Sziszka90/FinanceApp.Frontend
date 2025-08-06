import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationApiService {

  // API base URL
  private apiUrl = environment?.apiUrl ?? '';

  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) {
    // Initialize HTTP client for API calls
  }

  login(loginRequestDto: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.apiUrl}/api/v1/auth/login`, loginRequestDto);
  }
}
