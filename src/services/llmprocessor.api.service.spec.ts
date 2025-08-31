import { TestBed } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { LlmProcessorApiService } from './llmprocessor.api.service';
import { environment } from 'src/environments/environment';
import { PromptRequestDto } from 'src/models/ChatDtos/prompt-request.dto';
import { PromptResponseDto } from 'src/models/ChatDtos/prompt-response.dto';

describe('LlmProcessorApiService', () => {
  let service: LlmProcessorApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [LlmProcessorApiService]
      });
    service = TestBed.inject(LlmProcessorApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send prompt and return response', () => {
    const promptRequest: PromptRequestDto = { } as PromptRequestDto;
    const mockResponse: PromptResponseDto = { Result: 'Test response' } as PromptResponseDto;

    service.promptRequest(promptRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.llmProcessorUrl}/llmprocessor/prompt`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
