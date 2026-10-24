import { PdfImportJobsService } from './pdf-import-jobs.service';

describe('PdfImportJobsService', () => {
  const storageKey = 'finance-app.pdf-import-jobs';
  let service: PdfImportJobsService;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-10-24T12:00:00.000Z'));
    service = new PdfImportJobsService();
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

  it('restores valid jobs from browser storage', () => {
    localStorage.setItem(storageKey, JSON.stringify([{
      correlationId: 'correlation-3',
      fileName: 'saved-statement.pdf',
      status: 'queued',
      createdAt: new Date().toISOString()
    }]));

    service = new PdfImportJobsService();

    expect(service.getJob('correlation-3')?.fileName).toBe('saved-statement.pdf');
  });
});
