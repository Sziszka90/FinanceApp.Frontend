import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetUserDto } from '../models/UserDtos/get-user.dto';
import { UpdateUserDto } from '../models/UserDtos/update-user.dto';
import { CreateUserDto } from '../models/UserDtos/create-user.dto';
import { UpdatePasswordDto } from 'src/models/UserDtos/update-password.dto';
import { ResendEmailConfirmationResponse } from 'src/models/UserDtos/resend-email-confirmation-response.dto';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  // API base URL
  private apiUrl = environment?.apiUrl ?? '';

  // eslint-disable-next-line no-unused-vars
  constructor(private http: HttpClient) { }

  register(createUserDto: CreateUserDto): Observable<GetUserDto> {
    return this.http.post<GetUserDto>(`${this.apiUrl}/api/v1/users`, createUserDto);
  }

  getActiveUser(): Observable<GetUserDto> {
    return this.http.get<GetUserDto>(`${this.apiUrl}/api/v1/users`);
  }

  updateUser(updatedUser: UpdateUserDto): Observable<GetUserDto> {
    return this.http.put<GetUserDto>(`${this.apiUrl}/api/v1/users`, updatedUser);
  }

  updatePassword(updatePasswordDto: UpdatePasswordDto): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/api/v1/users/password`, updatePasswordDto);
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/v1/users/password-reset`, { email });
  }

  resendConfirmationEmail(email: string): Observable<ResendEmailConfirmationResponse> {
    return this.http.post<ResendEmailConfirmationResponse>(`${this.apiUrl}/api/v1/users/email-confirmation`, { email });
  }
}
