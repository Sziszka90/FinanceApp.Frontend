import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpendingAnalyticsComponent } from './spending-analytics.component';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SpendingAnalyticsComponent', () => {
  let component: SpendingAnalyticsComponent;
  let fixture: ComponentFixture<SpendingAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingAnalyticsComponent, BrowserAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TransactionApiService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpendingAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.loading()).toBe(false);
    expect(component.spendingData()).toEqual([]);
    expect(component.totalSpending()).toBe(0);
    expect(component.chartType()).toBe('pie');
  });

  it('should toggle chart type', () => {
    expect(component.chartType()).toBe('pie');
    component.toggleChartType();
    expect(component.chartType()).toBe('bar');
    component.toggleChartType();
    expect(component.chartType()).toBe('pie');
  });
});
