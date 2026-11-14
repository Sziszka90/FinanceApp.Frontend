import { inject, Injectable } from '@angular/core';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticationApiService } from './authentication.api.service';
import { CorrelationService } from './correlation.service';
import { UserApiService } from './user.api.service';
import { TokenType } from 'src/models/Enums/token-type.enum';
import { TokenApiService } from './token.api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private router = inject(Router);
  private authApiService = inject(AuthenticationApiService);
  private correlationService = inject(CorrelationService);
  private userService = inject(UserApiService);
  private tokenApiService = inject(TokenApiService);
  private authenticationCheck: Promise<boolean> | null = null;
  private authenticationStateVersion = 0;

  public userLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  async logoutAsync(): Promise<void> {
    try {
      await firstValueFrom(this.authApiService.logout());
      this.authenticationStateVersion++;
      this.authenticationCheck = null;
      this.correlationService.clearAllCorrelationIds();
      this.userLoggedIn.next(false);
      this.router.navigate(['/login']);
    } catch {
      throw new Error('Logout failed. Please try again later.');
    }
  }

  async loginAsync(loginRequestDto: LoginRequestDto): Promise<void> {
    await firstValueFrom(this.authApiService.login(loginRequestDto));
    // Ignore any startup auth check that began before login completed.
    this.authenticationStateVersion++;
    this.authenticationCheck = null;
    this.correlationService.clearAllCorrelationIds();
    this.userLoggedIn.next(true);
  }

  async isAuthenticatedAsync(): Promise<boolean> {
    if (this.authenticationCheck) {
      return this.authenticationCheck;
    }

    const check = this.checkAuthenticationAsync(this.authenticationStateVersion);
    this.authenticationCheck = check;
    try {
      return await check;
    } finally {
      if (this.authenticationCheck === check) {
        this.authenticationCheck = null;
      }
    }
  }

  private async checkAuthenticationAsync(stateVersion: number): Promise<boolean> {
    try {
      let result = await firstValueFrom(this.authApiService.isAuthenticated());
      if (!result) {
        // The refresh cookie may still be valid when the short-lived access cookie has expired.
        try {
          await firstValueFrom(this.tokenApiService.refreshToken());
          result = await firstValueFrom(this.authApiService.isAuthenticated());
        } catch {
          result = false;
        }
      }

      if (stateVersion !== this.authenticationStateVersion) {
        return this.userLoggedIn.value;
      }

      this.userLoggedIn.next(result);
      return result;
    } catch {
      if (stateVersion !== this.authenticationStateVersion) {
        return this.userLoggedIn.value;
      }

      this.userLoggedIn.next(false);
      return false;
    }
  }

  async getUserEmail(): Promise<string> {
    try {
      const user = await firstValueFrom(this.userService.getActiveUser());
      return user?.email;
    } catch {
      throw new Error('Error fetching user email');
    }
  }

  async validateTokenAsync(token: string, tokenType = TokenType.Login): Promise<boolean> {
    let result;
    try {
      result = await firstValueFrom(this.tokenApiService.verifyToken({ token, tokenType: tokenType }));
    } catch {
      throw new Error('Error verifying token');
    }

    if (!result.isValid) {
      await this.logoutAsync();
      return false;
    }
    return true;
  }
}
