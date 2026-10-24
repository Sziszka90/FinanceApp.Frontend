export type PdfImportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface PdfImportStatusDto {
  correlationId: string;
  status: PdfImportStatus;
  error?: string | null;
  updatedAt: string;
}
