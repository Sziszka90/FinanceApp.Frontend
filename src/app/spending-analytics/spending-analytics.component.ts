import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';

import { TransactionApiService } from 'src/services/transactions.api.service';
import { UserApiService } from 'src/services/user.api.service';
import { TopTransactionGroupDto } from 'src/models/TransactionGroupDtos/top-transaction-group.dto';
import { GetUserDto } from 'src/models/UserDtos/get-user.dto';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { LoaderComponent } from '../shared/loader/loader.component';
import { BaseComponent } from '../shared/base-component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { switchMap } from 'rxjs';

Chart.register(...registerables);

interface SpendingByGroup {
  groupName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

@Component({
  selector: 'spending-analytics',
  imports: [
    LoaderComponent,
    ReactiveFormsModule,
    MatSelectModule,
    MatButtonModule,
    BsDatepickerModule
],
  templateUrl: './spending-analytics.component.html',
  styleUrl: './spending-analytics.component.scss',
  standalone: true
})
export class SpendingAnalyticsComponent extends BaseComponent implements OnInit {
  private transactionApiService = inject(TransactionApiService);
  private userApiService = inject(UserApiService);
  private fb = inject(FormBuilder);

  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;

  public override loading = signal<boolean>(false);
  public spendingData = signal<SpendingByGroup[]>([]);
  public totalSpending = signal<number>(0);
  public chartType = signal<'pie' | 'bar'>('pie');
  public user = signal<GetUserDto | null>(null);

  private pieChart: Chart | null = null;
  private barChart: Chart | null = null;

  filterForm: FormGroup = this.fb.group({
    startDate: [null],
    endDate: [null],
  });

  ngOnInit(): void {
    this.loadSpendingData();

    this.filterForm.valueChanges.subscribe(() => {
      this.loadSpendingData();
    });
  }

  loadSpendingData(): void {
    this.loading.set(true);
    const filterValues = this.filterForm.value;
    
    const startDate = filterValues.startDate ? new Date(filterValues.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = filterValues.endDate ? new Date(filterValues.endDate) : new Date();
    
    this.userApiService.getActiveUser().pipe(
      switchMap(user => {
        this.user.set(user);
        return this.transactionApiService.getTopTransactionGroups(startDate, endDate, user.id, undefined);
      })
    ).subscribe({
      next: (topGroups: TopTransactionGroupDto[]) => {
        this.processTopGroups(topGroups);
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 100);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.loading.set(false);
      }
    });
  }

  private processTopGroups(topGroups: TopTransactionGroupDto[]): void {
    const total = topGroups.reduce((sum, g) => sum + Math.abs(g.totalAmount.amount), 0);
    this.totalSpending.set(total);

    const spendingData: SpendingByGroup[] = topGroups
      .map(group => {
        const amount = Math.abs(group.totalAmount.amount);
        return {
          groupName: group.name,
          totalAmount: amount,
          transactionCount: group.transactionCount,
          percentage: total > 0 ? (amount / total) * 100 : 0
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    this.spendingData.set(spendingData);
  }

  private renderCharts(): void {
    if (!this.pieChartRef?.nativeElement || !this.barChartRef?.nativeElement) {
      return;
    }

    const data = this.spendingData();
    if (data.length === 0) {
      console.log('No spending data available');
      return;
    }

    const labels = data.map(d => d.groupName);
    const amounts = data.map(d => d.totalAmount);
    const colors = this.generateColors(data.length);

    if (this.pieChart) {
      this.pieChart.destroy();
    }
    if (this.barChart) {
      this.barChart.destroy();
    }

    const pieConfig: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: amounts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 12 },
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = ((value / this.totalSpending()) * 100).toFixed(1);
                return `${label}: €${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    const barConfig: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Amount (€)',
          data: amounts,
          backgroundColor: colors,
          borderWidth: 1,
          borderColor: colors.map(c => c.replace('0.7', '1'))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y || 0;
                const percentage = ((value / this.totalSpending()) * 100).toFixed(1);
                return `€${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `€${value}`
            }
          }
        }
      }
    };

    this.pieChart = new Chart(this.pieChartRef.nativeElement, pieConfig);
    this.barChart = new Chart(this.barChartRef.nativeElement, barConfig);
  }

  private generateColors(count: number): string[] {
    const baseColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(255, 99, 255, 0.7)',
      'rgba(99, 255, 132, 0.7)'
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  toggleChartType(): void {
    this.chartType.update(type => type === 'pie' ? 'bar' : 'pie');
  }

  resetFilters(): void {
    this.filterForm.patchValue({
      startDate: null,
      endDate: null,
    });
  }

  getCurrencySymbol(): string {
    const user = this.user();
    if (!user) return '€';
    
    switch (user.baseCurrency) {
      case CurrencyEnum.EUR: return '€';
      case CurrencyEnum.USD: return '$';
      case CurrencyEnum.GBP: return '£';
      case CurrencyEnum.HUF: return 'Ft';
      default: return '€';
    }
  }
}
