import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { catchError, map, Observable, of, Subject } from 'rxjs';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { TOKEN_KEY } from 'src/models/Constants/token.const';
import { Router } from '@angular/router';
import { AuthenticationApiService } from './authentication.api.service';
import { CorrelationService } from './correlation.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private authApiService = inject(AuthenticationApiService);
  private correlationService = inject(CorrelationService);

  private readonly tokenKey: string = TOKEN_KEY;
  public userLoggedIn: Subject<boolean> = new Subject<boolean>();

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      this.correlationService.clearAllCorrelationIds();
    }
    this.userLoggedIn.next(false);
    this.router.navigate(['/login']);
  }

  login(loginRequestDto: LoginRequestDto): Observable<LoginResponseDto> {
    this.correlationService.clearAllCorrelationIds();
    return this.authApiService.login(loginRequestDto);
  }

  isAuthenticated(): boolean {
    if (!this.validateToken()) {
      return false;
    }
    return true;
  }

  validateToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const decodedToken: any = jwtDecode(token);

      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < currentTime) {
        console.log('Token has expired.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
  }

  validateTokenWithApi(token: string): Observable<boolean> {
    return this.authApiService.validateToken(token).pipe(
      map((response) => response.isValid),
      catchError(() => of(false))
    );
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.sub || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}

