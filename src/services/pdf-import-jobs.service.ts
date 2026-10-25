import { inject, Injectable, signal } from '@angular/core';
import { finalize, Subject } from 'rxjs';
import { TransactionApiService } from './transactions.api.service';
import { PdfImportStatus } from 'src/models/TransactionDtos/pdf-import-status.dto';

export type PdfImportJobStatus = 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';

export interface PdfImportJob {
  correlationId: string;
  fileName: string;
  status: PdfImportJobStatus;
  createdAt: string;
  error?: string;
}

const STORAGE_KEY = 'finance-app.pdf-import-jobs';
const MAX_JOBS = 20;
const JOB_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PdfImportJobsService {
  private readonly transactionApi = inject(TransactionApiService);
  private readonly statusRequests = new Set<string>();
  private readonly completedSubject = new Subject<string>();
  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.refreshActiveJobs();
    }
  };
  readonly jobs = signal<PdfImportJob[]>(this.readJobs());
  readonly completed$ = this.completedSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      window.setInterval(() => this.refreshActiveJobs(), 5_000);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  add(correlationId: string, fileName: string): void {
    this.updateJobs(jobs => [
      { correlationId, fileName, status: 'uploading', createdAt: new Date().toISOString() },
      ...jobs.filter(job => job.correlationId !== correlationId)
    ]);
  }

  markQueued(correlationId: string): void {
    this.updateJob(correlationId, job => (job.status === 'uploading' ? { ...job, status: 'queued' } : job));
  }

  markProcessing(correlationId: string): void {
    this.updateJob(correlationId, job =>
      job.status === 'queued' || job.status === 'uploading' ? { ...job, status: 'processing' } : job
    );
  }

  syncStatus(correlationId: string, status: PdfImportStatus, error?: string | null): void {
    const job = this.getJob(correlationId);
    if (!job) {
      return;
    }

    const isTerminal = job.status === 'completed' || job.status === 'failed';
    const receivedStatusIsTerminal = status === 'completed' || status === 'failed';
    if (isTerminal && !receivedStatusIsTerminal) {
      return;
    }

    this.updateJob(correlationId, current => ({ ...current, status, error: error ?? undefined }));
    if (status === 'completed' && job.status !== 'completed') {
      this.completedSubject.next(correlationId);
    }
  }

  complete(correlationId: string): void {
    const job = this.getJob(correlationId);
    if (!job) {
      return;
    }

    this.updateJob(correlationId, job => ({ ...job, status: 'completed', error: undefined }));
    if (job.status !== 'completed') {
      this.completedSubject.next(correlationId);
    }
  }

  fail(correlationId: string, error: string): void {
    this.updateJob(correlationId, job => ({ ...job, status: 'failed', error }));
  }

  remove(correlationId: string): void {
    this.updateJobs(jobs => jobs.filter(job => job.correlationId !== correlationId));
  }

  getJob(correlationId: string): PdfImportJob | undefined {
    return this.jobs().find(job => job.correlationId === correlationId);
  }

  private updateJob(correlationId: string, update: (job: PdfImportJob) => PdfImportJob): void {
    if (!this.getJob(correlationId)) {
      return;
    }
    this.updateJobs(jobs => jobs.map(job => (job.correlationId === correlationId ? update(job) : job)));
  }

  private refreshActiveJobs(): void {
    for (const job of this.jobs()) {
      if ((job.status !== 'queued' && job.status !== 'processing') || this.statusRequests.has(job.correlationId)) {
        continue;
      }

      this.statusRequests.add(job.correlationId);
      this.transactionApi
        .getPdfImportStatus(job.correlationId)
        .pipe(finalize(() => this.statusRequests.delete(job.correlationId)))
        .subscribe({
          next: status => this.syncStatus(job.correlationId, status.status, status.error),
          error: () => undefined
        });
    }
  }

  private updateJobs(update: (jobs: PdfImportJob[]) => PdfImportJob[]): void {
    const jobs = this.prune(update(this.jobs())).slice(0, MAX_JOBS);
    this.jobs.set(jobs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.warn('PDF import jobs could not be saved in browser storage.', error);
    }
  }

  private readJobs(): PdfImportJob[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? this.prune(JSON.parse(saved) as PdfImportJob[]).slice(0, MAX_JOBS) : [];
    } catch {
      return [];
    }
  }

  private prune(jobs: PdfImportJob[]): PdfImportJob[] {
    const cutoff = Date.now() - JOB_RETENTION_MS;
    return jobs.filter(
      job =>
        job &&
        typeof job.correlationId === 'string' &&
        typeof job.fileName === 'string' &&
        ['uploading', 'queued', 'processing', 'completed', 'failed'].includes(job.status) &&
        Date.parse(job.createdAt) >= cutoff
    );
  }
}
