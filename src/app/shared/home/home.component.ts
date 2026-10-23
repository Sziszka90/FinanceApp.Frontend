import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { GetTransactionDto } from 'src/models/TransactionDtos/get-transaction.dto';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { AuthenticationService } from 'src/services/authentication.service';
import { NotificationService } from 'src/services/notification.service';
import { UserApiService } from 'src/services/user.api.service';

interface SnapshotCategory {
  name: string;
  icon: string;
  amount: number;
}

interface MonthlySnapshot {
  currency: string;
  total: number;
  comparison: number | null;
  comparisonText: string;
  isLowerThanPrevious: boolean;
  chartLine: string;
  chartArea: string;
  dateLabels: string[];
  categories: SnapshotCategory[];
}

@Component({
  selector: 'home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private authenticationService = inject(AuthenticationService);
  private transactionApiService = inject(TransactionApiService);
  private notificationService = inject(NotificationService);
  private userApiService = inject(UserApiService);
  private destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly authenticated = signal(false);
  readonly snapshot = signal<MonthlySnapshot | null>(null);
  readonly loadFailed = signal(false);
  readonly selectedMonth = signal(this.monthInputValue(new Date()));
  readonly availableMonths = signal<Array<{ value: string; label: string }>>([]);
  private loadedTransactions: GetTransactionDto[] | null = null;
  private loadedCurrency: string | null = null;

  ngOnInit(): void {
    this.loadSnapshot();
    this.notificationService.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadSnapshot());
  }

  async loadSnapshot(): Promise<void> {
    this.loading.set(true);
    this.loadFailed.set(false);

    try {
      const isAuthenticated = await this.authenticationService.isAuthenticatedAsync();
      this.authenticated.set(isAuthenticated);

      if (!isAuthenticated) {
        this.loading.set(false);
        return;
      }

      forkJoin({
        user: this.userApiService.getActiveUser(),
        transactions: this.transactionApiService.getAllTransactions()
      }).subscribe({
        next: ({ user, transactions }) => {
          const currency = this.currencyCode(user.baseCurrency);
          this.loadedTransactions = transactions;
          this.loadedCurrency = currency;
          this.availableMonths.set(this.buildMonthOptions(transactions));
          this.snapshot.set(this.buildSnapshot(transactions, currency, this.selectedMonthDate()));
          this.loading.set(false);
        },
        error: error => {
          console.error('Unable to load the monthly snapshot:', error);
          this.loadFailed.set(true);
          this.loading.set(false);
        }
      });
    } catch (error) {
      console.error('Unable to check sign-in status for the monthly snapshot:', error);
      this.loadFailed.set(true);
      this.loading.set(false);
    }
  }

  onMonthChange(event: Event): void {
    const monthValue = (event.target as HTMLInputElement).value;
    if (!this.availableMonths().some(month => month.value === monthValue)) return;

    this.selectedMonth.set(monthValue);
    if (this.loadedTransactions && this.loadedCurrency) {
      this.snapshot.set(this.buildSnapshot(
        this.loadedTransactions,
        this.loadedCurrency,
        this.selectedMonthDate()
      ));
    }
  }

  formatAmount(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  isFontAwesomeIcon(icon: string): boolean {
    return icon.split(/\s+/).some(className => className === 'fa' || className.startsWith('fa-'));
  }

  private buildSnapshot(transactions: GetTransactionDto[], currency: string, selectedMonth: Date): MonthlySnapshot {
    const today = new Date();
    const monthYear = selectedMonth.getFullYear();
    const monthIndex = selectedMonth.getMonth();
    const monthStart = new Date(monthYear, monthIndex, 1);
    const isCurrentMonth = monthYear === today.getFullYear() && monthIndex === today.getMonth();
    const periodEndDay = isCurrentMonth
      ? today.getDate()
      : new Date(monthYear, monthIndex + 1, 0).getDate();
    const periodEnd = new Date(monthYear, monthIndex, periodEndDay);
    const previousMonthStart = new Date(monthYear, monthIndex - 1, 1);
    const previousPeriodEnd = new Date(
      previousMonthStart.getFullYear(),
      previousMonthStart.getMonth(),
      Math.min(periodEndDay, new Date(monthYear, monthIndex, 0).getDate())
    );

    const currentMonthTransactions = transactions.filter(transaction =>
      this.isExpense(transaction) &&
      this.currencyCode(transaction.value.currency) === currency &&
      this.isWithin(transaction, monthStart, periodEnd)
    );
    const previousMonthTransactions = transactions.filter(transaction =>
      this.isExpense(transaction) &&
      this.currencyCode(transaction.value.currency) === currency &&
      this.isWithin(transaction, previousMonthStart, previousPeriodEnd)
    );

    const total = currentMonthTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.value.amount), 0);
    const previousTotal = previousMonthTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.value.amount), 0);
    const comparison = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null;
    const comparisonText = comparison === null
      ? (total > 0 ? 'No comparison yet' : 'No spending this month')
      : `${Math.abs(comparison).toFixed(1)}% ${comparison <= 0 ? 'less' : 'more'} than the same period last month`;

    const grouped = new Map<string, SnapshotCategory>();
    for (const transaction of currentMonthTransactions) {
      const group = transaction.transactionGroup;
      const key = group?.id ?? 'uncategorized';
      const category = grouped.get(key) ?? {
        name: group?.name ?? 'Uncategorized',
        icon: group?.groupIcon ?? 'receipt_long',
        amount: 0
      };
      category.amount += Math.abs(transaction.value.amount);
      grouped.set(key, category);
    }

    return {
      currency,
      total,
      comparison,
      comparisonText,
      isLowerThanPrevious: comparison !== null && comparison <= 0,
      chartLine: this.buildChartLine(currentMonthTransactions, periodEnd),
      chartArea: this.buildChartArea(currentMonthTransactions, periodEnd),
      dateLabels: this.getDateLabels(periodEnd, isCurrentMonth),
      categories: Array.from(grouped.values()).sort((a, b) => b.amount - a.amount).slice(0, 2)
    };
  }

  private buildChartLine(transactions: GetTransactionDto[], today: Date): string {
    const dailyTotals = this.getDailyTotals(transactions, today);
    const cumulativeTotals: number[] = [];
    dailyTotals.reduce((sum, amount, index) => {
      cumulativeTotals[index] = sum + amount;
      return cumulativeTotals[index];
    }, 0);

    const maximum = Math.max(...cumulativeTotals, 0);
    const denominator = Math.max(cumulativeTotals.length - 1, 1);
    const points = cumulativeTotals.map((amount, index) => {
      const x = (index / denominator) * 440;
      const y = maximum > 0 ? 108 - (amount / maximum) * 86 : 108;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    return points.join(' ');
  }

  private buildChartArea(transactions: GetTransactionDto[], today: Date): string {
    const line = this.buildChartLine(transactions, today);
    return `${line} L440 120 L0 120 Z`;
  }

  private getDailyTotals(transactions: GetTransactionDto[], today: Date): number[] {
    const totals = Array.from({ length: today.getDate() }, () => 0);
    for (const transaction of transactions) {
      const day = new Date(transaction.transactionDate).getDate();
      if (day >= 1 && day <= totals.length) {
        totals[day - 1] += Math.abs(transaction.value.amount);
      }
    }
    return totals;
  }

  private getDateLabels(periodEnd: Date, isCurrentMonth: boolean): string[] {
    const dates = [1, 8, 15, 22].filter(day => day < periodEnd.getDate());
    const labels = dates
      .map(day => new Date(periodEnd.getFullYear(), periodEnd.getMonth(), day)
        .toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))
    labels.push(isCurrentMonth
      ? 'Today'
      : periodEnd.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
    return labels;
  }

  private selectedMonthDate(): Date {
    const [year, month] = this.selectedMonth().split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  private buildMonthOptions(transactions: GetTransactionDto[]): Array<{ value: string; label: string }> {
    const current = new Date();
    const currentMonth = new Date(current.getFullYear(), current.getMonth(), 1);
    const transactionDates = transactions
      .map(transaction => new Date(transaction.transactionDate))
      .filter(date => !Number.isNaN(date.getTime()))
      .map(date => new Date(date.getFullYear(), date.getMonth(), 1))
      .filter(date => date <= currentMonth);
    const firstTransaction = transactionDates.reduce(
      (earliest, date) => date < earliest ? date : earliest,
      currentMonth
    );
    const firstMonth = new Date(firstTransaction.getFullYear(), firstTransaction.getMonth(), 1);
    const months: Array<{ value: string; label: string }> = [];

    for (let month = currentMonth; month >= firstMonth; month = new Date(month.getFullYear(), month.getMonth() - 1, 1)) {
      months.push({
        value: this.monthInputValue(month),
        label: month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      });
    }

    return months;
  }

  private monthInputValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private isWithin(transaction: GetTransactionDto, start: Date, end: Date): boolean {
    const date = new Date(transaction.transactionDate);
    return date >= start && date <= new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  }

  private isExpense(transaction: GetTransactionDto): boolean {
    const type: unknown = transaction.transactionType;
    return type === TransactionTypeEnum.Expense || type === 'Expense' || type === `${TransactionTypeEnum.Expense}`;
  }

  private currencyCode(currency: CurrencyEnum | string): string {
    if (typeof currency === 'string' && !/^\d+$/.test(currency)) {
      return currency;
    }
    const numericValue = Number(currency);
    return CurrencyEnum[numericValue] ?? 'EUR';
  }
}
