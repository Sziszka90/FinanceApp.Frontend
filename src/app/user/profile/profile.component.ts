import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, form, minLength } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { UserApiService } from 'src/services/user.api.service';
import { AuthenticationService } from 'src/services/authentication.service';
import { GetUserDto } from 'src/models/UserDtos/get-user.dto';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { BaseComponent } from 'src/app/shared/base-component';
import { BankStatementPromptDto } from 'src/models/UserDtos/bank-statement-prompt.dto';

@Component({
  selector: 'profile',
  imports: [FormField, FormRoot, MatSelectModule, LoaderComponent],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.component.scss'
})
export class ProfileComponent extends BaseComponent implements OnInit {
  private userApiService = inject(UserApiService);
  private authService = inject(AuthenticationService);
  private router = inject(Router);

  readonly bankStatementPrompts = signal<BankStatementPromptDto[]>([]);
  readonly selectedBankStatementPromptId = signal<string | null>(null);
  readonly promptName = signal('');
  readonly promptInstructions = signal('');
  readonly editingPromptId = signal<string | null>(null);
  readonly showPasswordChangeForm = signal(false);
  readonly newPassword = signal('');
  readonly confirmNewPassword = signal('');
  readonly passwordsMatch = computed(() =>
    !!this.newPassword() && this.newPassword() === this.confirmNewPassword()
  );
  readonly newPasswordIsValid = computed(() => {
    const password = this.newPassword();
    return password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && /[^a-zA-Z0-9]/.test(password);
  });

  readonly profileModel = signal({
    userName: '',
    currency: CurrencyEnum.EUR
  });

  readonly profileForm = form(this.profileModel, path => {
    minLength(path.userName, 2, { message: 'Minimum 2 characters required' });
  }, {
    submission: {
      action: async () => {
        const model = this.profileModel();
        this.setLoading(true);
        try {
          await firstValueFrom(this.userApiService.updateUser({
            id: this.user?.id,
            userName: model.userName || this.user?.userName,
            baseCurrency: model.currency ?? CurrencyEnum.EUR
          }));
          this.setLoading(false);
          await this.router.navigate(['/']);
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Failed to update profile');
        }
      }
    }
  });

  user!: GetUserDto;

  currencyOptions = (Object.values(CurrencyEnum)
    .filter(value => typeof value === 'number' && value !== CurrencyEnum.XXX) as CurrencyEnum[]);
  readonly CurrencyEnum = CurrencyEnum;

  ngOnInit(): void {
    this.userApiService.getActiveUser().subscribe({
      next: user => {
        this.user = user;
        this.profileModel.update(model => ({
          ...model,
          userName: user.userName,
          currency: user.baseCurrency
        }));
      },
      error: error => {
        this.handleError(error, 'Failed to load user profile');
      }
    });
    this.loadBankStatementPrompts();
  }

  loadBankStatementPrompts(): void {
    this.userApiService.getBankStatementPrompts().subscribe({
      next: prompts => {
        this.bankStatementPrompts.set(prompts);
        this.selectedBankStatementPromptId.set(prompts.find(prompt => prompt.isSelected)?.id ?? null);
      },
      error: error => this.handleError(error, 'Failed to load bank statement prompts')
    });
  }

  selectBankStatementPrompt(event: Event): void {
    const id = (event.target as HTMLSelectElement).value || null;
    this.userApiService.selectBankStatementPrompt(id).subscribe({
      next: () => {
        this.selectedBankStatementPromptId.set(id);
        this.bankStatementPrompts.update(prompts => prompts.map(prompt => ({ ...prompt, isSelected: prompt.id === id })));
      },
      error: error => {
        this.loadBankStatementPrompts();
        this.handleError(error, 'Failed to select bank statement prompt');
      }
    });
  }

  togglePasswordChangeForm(): void {
    if (this.showPasswordChangeForm()) {
      this.newPassword.set('');
      this.confirmNewPassword.set('');
    }
    this.showPasswordChangeForm.update(isVisible => !isVisible);
  }

  async changePassword(): Promise<void> {
    if (!this.newPasswordIsValid()) {
      this.showError('Password must be at least 8 characters and include uppercase and lowercase letters, a number, and a special character.');
      return;
    }
    if (!this.passwordsMatch()) {
      this.showError('The passwords do not match.');
      return;
    }

    const model = this.profileModel();
    this.setLoading(true);
    try {
      await firstValueFrom(this.userApiService.updateUser({
        id: this.user.id,
        userName: model.userName || this.user.userName,
        password: this.newPassword(),
        baseCurrency: model.currency ?? CurrencyEnum.EUR
      }));
      this.setLoading(false);
      this.newPassword.set('');
      this.confirmNewPassword.set('');
      this.showPasswordChangeForm.set(false);
      this.showSuccess('Password changed successfully.');
    } catch (error) {
      this.setLoading(false);
      this.handleError(error, 'Failed to change password');
    }
  }

  saveBankStatementPrompt(): void {
    const payload = { name: this.promptName().trim(), instructions: this.promptInstructions().trim() };
    if (!payload.name || !payload.instructions) {
      this.showError('Enter a name and instructions for the bank statement prompt.');
      return;
    }

    const editingId = this.editingPromptId();
    const request = editingId
      ? this.userApiService.updateBankStatementPrompt(editingId, payload)
      : this.userApiService.createBankStatementPrompt(payload);

    request.subscribe({
      next: () => {
        this.promptName.set('');
        this.promptInstructions.set('');
        this.editingPromptId.set(null);
        this.loadBankStatementPrompts();
      },
      error: error => this.handleError(error, 'Failed to save bank statement prompt')
    });
  }

  editBankStatementPrompt(prompt: BankStatementPromptDto): void {
    this.editingPromptId.set(prompt.id);
    this.promptName.set(prompt.name);
    this.promptInstructions.set(prompt.instructions);
  }

  cancelPromptEdit(): void {
    this.editingPromptId.set(null);
    this.promptName.set('');
    this.promptInstructions.set('');
  }

  deleteBankStatementPrompt(prompt: BankStatementPromptDto): void {
    if (!window.confirm(`Delete the "${prompt.name}" prompt?`)) return;

    this.userApiService.deleteBankStatementPrompt(prompt.id).subscribe({
      next: () => {
        if (this.selectedBankStatementPromptId() === prompt.id) {
          this.selectedBankStatementPromptId.set(null);
        }
        this.loadBankStatementPrompts();
      },
      error: error => this.handleError(error, 'Failed to delete bank statement prompt')
    });
  }

  async logout(): Promise<void> {
    await this.authService.logoutAsync();
    await this.router.navigate(['/login']);
  }

  compareCategoryObjects(object1: CurrencyEnum, object2: CurrencyEnum) {
    if (object1 == null || object2 == null) {
      return false;
    }

    return object1 === object2;
  }
}
