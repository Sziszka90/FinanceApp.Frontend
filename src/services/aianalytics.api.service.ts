import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PromptResponseDto } from 'src/models/ChatDtos/prompt-response.dto';
import { PromptRequestDto } from 'src/models/ChatDtos/prompt-request.dto';
import {
  MonthlyInsightsRequestDto,
  MonthlyInsightsResponseDto
} from 'src/models/AIAnalytics/monthly-insights.dto';

@Injectable({
  providedIn: 'root'
})
export class AIAnalyticsApiService {
  private http = inject(HttpClient);

  private readonly apiUrl = environment?.aiAnalyticsUrl ?? '';
  private readonly backendApiUrl = environment?.apiUrl ?? '';

  promptRequest(request: PromptRequestDto): Observable<PromptResponseDto> {
    return this.http.post<PromptResponseDto>(`${this.apiUrl}/aianalytics/prompt`, request);
  }

  getMonthlyInsights(request: MonthlyInsightsRequestDto): Observable<MonthlyInsightsResponseDto> {
    return this.http.post<MonthlyInsightsResponseDto>(
      `${this.backendApiUrl}/api/v1/transactions/monthly-insights`,
      request,
      { withCredentials: true }
    );
  }
}
