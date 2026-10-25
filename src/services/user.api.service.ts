import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetUserDto } from '../models/UserDtos/get-user.dto';
import { UpdateUserDto } from '../models/UserDtos/update-user.dto';
import { CreateUserDto } from '../models/UserDtos/create-user.dto';
import { UpdatePasswordDto } from 'src/models/UserDtos/update-password.dto';
import { ResendEmailConfirmationResponse } from 'src/models/UserDtos/resend-email-confirmation-response.dto';
import { BankStatementPromptDto, SaveBankStatementPromptDto } from 'src/models/UserDtos/bank-statement-prompt.dto';
import { CategorizationRuleDto, SaveCategorizationRuleDto } from 'src/models/UserDtos/categorization-rule.dto';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private apiUrl = environment?.apiUrl ?? '';

  constructor(private http: HttpClient) {}

  register(createUserDto: CreateUserDto): Observable<GetUserDto> {
    return this.http.post<GetUserDto>(`${this.apiUrl}/api/v1/users`, createUserDto, { withCredentials: true });
  }

  getActiveUser(): Observable<GetUserDto> {
    return this.http.get<GetUserDto>(`${this.apiUrl}/api/v1/users`, { withCredentials: true });
  }

  updateUser(updatedUser: UpdateUserDto): Observable<GetUserDto> {
    return this.http.put<GetUserDto>(`${this.apiUrl}/api/v1/users`, updatedUser, { withCredentials: true });
  }

  getBankStatementPrompts(): Observable<BankStatementPromptDto[]> {
    return this.http.get<BankStatementPromptDto[]>(`${this.apiUrl}/api/v1/bankstatementprompts`, {
      withCredentials: true
    });
  }

  createBankStatementPrompt(prompt: SaveBankStatementPromptDto): Observable<BankStatementPromptDto> {
    return this.http.post<BankStatementPromptDto>(`${this.apiUrl}/api/v1/bankstatementprompts`, prompt, {
      withCredentials: true
    });
  }

  updateBankStatementPrompt(id: string, prompt: SaveBankStatementPromptDto): Observable<BankStatementPromptDto> {
    return this.http.put<BankStatementPromptDto>(`${this.apiUrl}/api/v1/bankstatementprompts/${id}`, prompt, {
      withCredentials: true
    });
  }

  selectBankStatementPrompt(id: string | null): Observable<boolean> {
    return id
      ? this.http.put<boolean>(`${this.apiUrl}/api/v1/bankstatementprompts/${id}/select`, {}, { withCredentials: true })
      : this.http.delete<boolean>(`${this.apiUrl}/api/v1/bankstatementprompts/selected`, { withCredentials: true });
  }

  deleteBankStatementPrompt(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/bankstatementprompts/${id}`, { withCredentials: true });
  }

  getCategorizationRules(): Observable<CategorizationRuleDto[]> {
    return this.http.get<CategorizationRuleDto[]>(`${this.apiUrl}/api/v1/categorizationrules`, { withCredentials: true });
  }

  createCategorizationRule(rule: SaveCategorizationRuleDto): Observable<CategorizationRuleDto> {
    return this.http.post<CategorizationRuleDto>(`${this.apiUrl}/api/v1/categorizationrules`, rule, { withCredentials: true });
  }

  updateCategorizationRule(id: string, rule: SaveCategorizationRuleDto): Observable<CategorizationRuleDto> {
    return this.http.put<CategorizationRuleDto>(`${this.apiUrl}/api/v1/categorizationrules/${id}`, rule, { withCredentials: true });
  }

  deleteCategorizationRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/categorizationrules/${id}`, { withCredentials: true });
  }

  updatePassword(updatePasswordDto: UpdatePasswordDto): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/api/v1/users/password`, updatePasswordDto, { withCredentials: true });
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/v1/users/password-reset`, { email }, { withCredentials: true });
  }

  resendConfirmationEmail(email: string): Observable<ResendEmailConfirmationResponse> {
    return this.http.post<ResendEmailConfirmationResponse>(
      `${this.apiUrl}/api/v1/users/email-confirmation`,
      { email },
      { withCredentials: true }
    );
  }
}
