import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ComponentErrorTrackingService {
  private handledErrors = new Set<string>();

  /**
   * Mark an error as handled by a component
   * @param error The error object from HTTP request
   * @param componentName Optional component name for debugging
   */
  markErrorAsHandled(error: any, componentName?: string): void {
    const errorId = this.generateErrorId(error);
    this.handledErrors.add(errorId);
    
    if (componentName) {
      console.debug(`Error marked as handled by ${componentName}:`, errorId);
    }
    
    // Clean up after a short delay to prevent memory leaks
    setTimeout(() => {
      this.handledErrors.delete(errorId);
    }, 1000);
  }

  /**
   * Check if an error has been marked as handled by a component
   * @param error The error object to check
   * @returns true if the error has been handled by a component
   */
  isErrorHandledByComponent(error: any): boolean {
    const errorId = this.generateErrorId(error);
    return this.handledErrors.has(errorId);
  }

  /**
   * Generate a unique identifier for an error
   * @param error The error object
   * @returns A unique string identifier for the error
   */
  private generateErrorId(error: any): string {
    const timestamp = error.timestamp || Date.now();
    const status = error.status || 0;
    const url = error.url || '';
    const message = error.message || error.error?.message || '';
    
    return `${timestamp}-${status}-${url}-${message}`.replace(/\s+/g, '');
  }
}
