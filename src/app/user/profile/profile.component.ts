import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, form, minLength, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { UserApiService } from 'src/services/user.api.service';
import { GetUserDto } from 'src/models/UserDtos/get-user.dto';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { BaseComponent } from 'src/app/shared/base-component';

@Component({
  selector: 'profile',
  imports: [FormField, FormRoot, MatSelectModule, LoaderComponent],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.component.scss'
})
export class ProfileComponent extends BaseComponent implements OnInit {
  private userApiService = inject(UserApiService);
  private router = inject(Router);

  readonly profileModel = signal({
    userName: '',
    password: '',
    currency: CurrencyEnum.EUR
  });

  readonly profileForm = form(this.profileModel, path => {
    minLength(path.userName, 2, { message: 'Minimum 2 characters required' });
    minLength(path.password, 8, { message: 'Password must be at least 8 characters long' });
    validate(path.password, ({ value }) => {
      const password = value();

      if (!password) {
        return undefined;
      }

      if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        return {
          kind: 'pattern',
          message: 'Password must include uppercase letter, number, and special character'
        };
      }

      return undefined;
    });
  }, {
    submission: {
      action: async () => {
        const model = this.profileModel();
        this.setLoading(true);
        try {
          await firstValueFrom(this.userApiService.updateUser({
            id: this.user?.id,
            userName: model.userName || this.user?.userName,
            password: model.password || '',
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
  }

  compareCategoryObjects(object1: CurrencyEnum, object2: CurrencyEnum) {
    if (object1 == null || object2 == null) {
      return false;
    }

    return object1 === object2;
  }
}
