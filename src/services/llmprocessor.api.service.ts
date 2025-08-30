import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PromptResponseDto } from 'src/models/ChatDtos/prompt-response.dto';
import { PromptRequestDto } from 'src/models/ChatDtos/prompt-request.dto';

@Injectable({
  providedIn: 'root'
})
export class LlmProcessorApiService {
  private http = inject(HttpClient);

  private readonly apiUrl = environment?.llmProcessorUrl ?? '';

  promptRequest(request: PromptRequestDto): Observable<PromptResponseDto> {
    const token = environment.llmProcessorToken;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<PromptResponseDto>(
      `${this.apiUrl}/llmprocessor/prompt`,
      request,
      { headers }
    );
  }
}
