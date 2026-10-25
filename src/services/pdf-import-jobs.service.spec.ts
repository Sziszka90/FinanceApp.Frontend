import { TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';
import { PdfImportJobsService } from './pdf-import-jobs.service';
import { TransactionApiService } from './transactions.api.service';

describe('PdfImportJobsService', () => {
  const storageKey = 'finance-app.pdf-import-jobs';
  let service: PdfImportJobsService;

  function createService(): PdfImportJobsService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PdfImportJobsService,
        { provide: TransactionApiService, useValue: { getPdfImportStatus: () => EMPTY } }
      ]
    });
    return TestBed.inject(PdfImportJobsService);
  }

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-10-24T12:00:00.000Z'));
    service = createService();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    localStorage.removeItem(storageKey);
  });

  it('tracks an import from upload through processing and completion', () => {
    service.add('correlation-1', 'statement.pdf');
    expect(service.getJob('correlation-1')?.status).toBe('uploading');

    service.markQueued('correlation-1');
    expect(service.getJob('correlation-1')?.status).toBe('queued');

    service.markProcessing('correlation-1');
    expect(service.getJob('correlation-1')?.status).toBe('processing');

    service.complete('correlation-1');
    expect(service.getJob('correlation-1')?.status).toBe('completed');
  });

  it('persists jobs, records failures, and removes dismissed jobs', () => {
    service.add('correlation-2', 'failed-statement.pdf');
    service.fail('correlation-2', 'Import failed');
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '[]')).toEqual(service.jobs());
    expect(service.getJob('correlation-2')?.error).toBe('Import failed');

    service.remove('correlation-2');
    expect(service.jobs()).toEqual([]);
  });

  it('keeps queued imports pending until the server reports a status', () => {
    service.add('correlation-queue-timeout', 'queued-statement.pdf');
    service.markQueued('correlation-queue-timeout');

    jasmine.clock().tick(5 * 60 * 1000);

    expect(service.getJob('correlation-queue-timeout')?.status).toBe('queued');
    expect(service.getJob('correlation-queue-timeout')?.error).toBeUndefined();
  });

  it('refreshes active import status when the browser tab becomes visible', () => {
    const transactionApi = TestBed.inject(TransactionApiService);
    spyOn(transactionApi, 'getPdfImportStatus').and.returnValue(
      of({
        correlationId: 'correlation-visible',
        status: 'completed',
        error: null,
        updatedAt: new Date().toISOString()
      })
    );
    const completed = jasmine.createSpy('completed');
    service.completed$.subscribe(completed);
    service.add('correlation-visible', 'statement.pdf');
    service.markQueued('correlation-visible');

    document.dispatchEvent(new Event('visibilitychange'));

    expect(transactionApi.getPdfImportStatus).toHaveBeenCalledWith('correlation-visible');
    expect(service.getJob('correlation-visible')?.status).toBe('completed');
    expect(completed).toHaveBeenCalledOnceWith('correlation-visible');
  });

  it('restores valid jobs from browser storage', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        {
          correlationId: 'correlation-3',
          fileName: 'saved-statement.pdf',
          status: 'queued',
          createdAt: new Date().toISOString()
        }
      ])
    );

    service = createService();

    expect(service.getJob('correlation-3')?.fileName).toBe('saved-statement.pdf');
  });
});
