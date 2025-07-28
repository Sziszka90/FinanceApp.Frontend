import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {
  private handledErrors = new Set<string>();

  markAsHandled(error: any): void {
    const errorId = this.getErrorId(error);
    this.handledErrors.add(errorId);
    
    // Clean up after a short delay to prevent memory leaks
    setTimeout(() => {
      this.handledErrors.delete(errorId);
    }, 1000);
  }

  isHandled(error: any): boolean {
    const errorId = this.getErrorId(error);
    return this.handledErrors.has(errorId);
  }

  private getErrorId(error: any): string {
    // Create a simple unique identifier for the error
    return `${error.status}-${error.url}-${Date.now()}`;
  }
}
