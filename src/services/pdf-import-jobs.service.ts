import { Injectable, signal } from '@angular/core';

export type PdfImportJobStatus = 'uploading' | 'queued' | 'completed' | 'failed';

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
const JOB_PROCESSING_TIMEOUT_MS = 30 * 60 * 1000;
const JOB_PROCESSING_TIMEOUT_MESSAGE =
  'No completion response arrived within 30 minutes. Check your transactions before retrying this PDF.';

@Injectable({ providedIn: 'root' })
export class PdfImportJobsService {
  readonly jobs = signal<PdfImportJob[]>(this.readJobs());

  constructor() {
    this.failStaleJobs();
    if (typeof window !== 'undefined') {
      window.setInterval(() => this.failStaleJobs(), 60_000);
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

  complete(correlationId: string): void {
    this.updateJob(correlationId, job => ({ ...job, status: 'completed', error: undefined }));
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

  private failStaleJobs(): void {
    const cutoff = Date.now() - JOB_PROCESSING_TIMEOUT_MS;
    if (!this.jobs().some(job => (job.status === 'uploading' || job.status === 'queued') && Date.parse(job.createdAt) <= cutoff)) {
      return;
    }

    this.updateJobs(jobs =>
      jobs.map(job =>
        (job.status === 'uploading' || job.status === 'queued') && Date.parse(job.createdAt) <= cutoff
          ? { ...job, status: 'failed', error: JOB_PROCESSING_TIMEOUT_MESSAGE }
          : job
      )
    );
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
        Date.parse(job.createdAt) >= cutoff
    );
  }
}
