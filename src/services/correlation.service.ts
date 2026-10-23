import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})

export class CorrelationService {
  private correlationIds: Map<string, string> = new Map();

  setCorrelationId(requestId: string): string {
    const correlationId = uuidv4();
    this.correlationIds.set(requestId, correlationId);
    return correlationId;
  }

  getCorrelationId(requestId: string): string | undefined {
    return this.correlationIds.get(requestId);
  }

  clearCorrelationId(requestId: string): void {
    this.correlationIds.delete(requestId);
  }

  public clearAllCorrelationIds(): void {
    this.correlationIds.clear();
  }
}
