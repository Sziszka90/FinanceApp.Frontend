import { inject, Injectable } from '@angular/core';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { jwtDecode } from 'jwt-decode';
import { TOKEN_KEY } from 'src/models/Constants/token.const';
import { Router } from '@angular/router';
import { AuthenticationApiService } from './authentication.api.service';
import { CorrelationService } from './correlation.service';
import { TokenApiService } from './token.api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private router = inject(Router);
  private authApiService = inject(AuthenticationApiService);
  private tokenApiService = inject(TokenApiService);
  private correlationService = inject(CorrelationService);

  private readonly tokenKey: string = TOKEN_KEY;
  public userLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  async logoutAsync(): Promise<void> {
    try {
      await firstValueFrom(this.authApiService.logout());
      localStorage.removeItem(this.tokenKey);
      this.correlationService.clearAllCorrelationIds();
      this.userLoggedIn.next(false);
      this.router.navigate(['/login']);
    } catch {
      throw new Error('Logout failed. Please try again later.');
    }
  }

  async loginAsync(loginRequestDto: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      const result = await firstValueFrom(this.authApiService.login(loginRequestDto));
      this.correlationService.clearAllCorrelationIds();
      this.saveToken(result.token);
      this.userLoggedIn.next(true);
      return result;
    } catch {
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  }

  async isAuthenticatedAsync(): Promise<boolean> {
    const result = await this.validateTokenAsync();
    if (!result) {
      this.userLoggedIn.next(false);
      return false;
    }
    this.userLoggedIn.next(true);
    return true;
  }

  async validateTokenAsync(tokenToValidate = ''): Promise<boolean> {
    let token = tokenToValidate;
    if (token === '') {
      token = this.getToken() ?? '';
    }

    if (!token) {
      return false;
    }

    try {
      const decodedToken: { exp: number; [key: string]: unknown } = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decodedToken.exp < currentTime) {
        console.warn('Token has expired.');
        return false;
      }
    } catch {
      throw new Error('Invalid token format');
    }

    let result = null;

    try {
      result = await firstValueFrom(this.tokenApiService.verifyToken(token));
    } catch {
      throw new Error('Error verifying token');
    }

    if (!result.isValid) {
      await this.logoutAsync();
      return false;
    }
    return true;
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decodedToken: { sub?: string; [key: string]: unknown } = jwtDecode(token);
      return decodedToken.sub || null;
    } catch {
      throw new Error('Error decoding token');
    }
  }
}

