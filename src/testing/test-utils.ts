import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

/**
 * Test utilities for Angular Finance App unit tests
 */
export class TestUtils {
  
  /**
   * Find element by CSS selector
   */
  static findElement<T>(fixture: ComponentFixture<T>, selector: string): DebugElement | null {
    return fixture.debugElement.query(By.css(selector));
  }

  /**
   * Find all elements by CSS selector
   */
  static findElements<T>(fixture: ComponentFixture<T>, selector: string): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(selector));
  }

  /**
   * Get element text content
   */
  static getElementText<T>(fixture: ComponentFixture<T>, selector: string): string {
    const element = this.findElement(fixture, selector);
    return element ? element.nativeElement.textContent.trim() : '';
  }

  /**
   * Click element by selector
   */
  static clickElement<T>(fixture: ComponentFixture<T>, selector: string): void {
    const element = this.findElement(fixture, selector);
    if (element) {
      element.nativeElement.click();
      fixture.detectChanges();
    }
  }

  /**
   * Set input value
   */
  static setInputValue<T>(fixture: ComponentFixture<T>, selector: string, value: string): void {
    const element = this.findElement(fixture, selector);
    if (element) {
      element.nativeElement.value = value;
      element.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  }

  /**
   * Wait for async operations to complete
   */
  static async waitForAsync(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Create mock observable that emits value
   */
  static mockObservable<T>(value: T) {
    return of(value);
  }

  /**
   * Create mock observable that throws error
   */
  static mockObservableError(error: any) {
    return throwError(error);
  }

  /**
   * Check if element exists
   */
  static elementExists<T>(fixture: ComponentFixture<T>, selector: string): boolean {
    return this.findElement(fixture, selector) !== null;
  }

  /**
   * Check if element is visible
   */
  static isElementVisible<T>(fixture: ComponentFixture<T>, selector: string): boolean {
    const element = this.findElement(fixture, selector);
    if (!element) return false;
    
    const nativeElement = element.nativeElement;
    const style = window.getComputedStyle(nativeElement);
    return style.display !== 'none' && style.visibility !== 'hidden' && nativeElement.offsetParent !== null;
  }

  /**
   * Get form control value
   */
  static getFormControlValue<T>(component: any, controlName: string): any {
    return component.formGroup?.get(controlName)?.value;
  }

  /**
   * Set form control value
   */
  static setFormControlValue<T>(component: any, controlName: string, value: any): void {
    const control = component.formGroup?.get(controlName);
    if (control) {
      control.setValue(value);
      control.markAsTouched();
    }
  }

  /**
   * Check if form control has error
   */
  static hasFormControlError<T>(component: any, controlName: string, errorType: string): boolean {
    const control = component.formGroup?.get(controlName);
    return control ? control.hasError(errorType) : false;
  }

  /**
   * Trigger form control validation
   */
  static triggerFormValidation<T>(component: any): void {
    if (component.formGroup) {
      Object.keys(component.formGroup.controls).forEach(key => {
        component.formGroup.get(key)?.markAsTouched();
        component.formGroup.get(key)?.updateValueAndValidity();
      });
    }
  }

  /**
   * Create spy object with methods
   */
  static createSpyObj<T = any>(baseName: string, methodNames: string[]): jasmine.SpyObj<T> {
    return jasmine.createSpyObj(baseName, methodNames);
  }

  /**
   * Create mock user data for testing
   */
  static createMockUser(overrides: Partial<any> = {}) {
    return {
      id: '123',
      userName: 'testuser',
      email: 'test@example.com',
      baseCurrency: 'EUR',
      ...overrides
    };
  }

  /**
   * Create mock transaction data for testing
   */
  static createMockTransaction(overrides: Partial<any> = {}) {
    return {
      id: '456',
      description: 'Test Transaction',
      amount: { value: 100, currency: 'EUR' },
      transactionType: 'Income',
      date: new Date().toISOString(),
      transactionGroupId: '789',
      ...overrides
    };
  }

  /**
   * Create mock transaction group data for testing
   */
  static createMockTransactionGroup(overrides: Partial<any> = {}) {
    return {
      id: '789',
      name: 'Test Group',
      description: 'Test Description',
      icon: { name: 'test-icon', color: '#000000' },
      ...overrides
    };
  }

  /**
   * Create mock API response
   */
  static createMockApiResponse<T>(data: T, success: boolean = true) {
    return {
      data,
      success,
      message: success ? 'Success' : 'Error',
      errors: success ? [] : ['Test error']
    };
  }

  /**
   * Simulate async error
   */
  static simulateAsyncError(errorMessage: string = 'Test error') {
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Wait for component to be stable
   */
  static async waitForComponentStable<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /**
   * Get error message elements
   */
  static getErrorMessages<T>(fixture: ComponentFixture<T>): string[] {
    const errorElements = this.findElements(fixture, '.error-message, .mat-error, .invalid-feedback');
    return errorElements.map(el => el.nativeElement.textContent.trim());
  }

  /**
   * Check if loading indicator is shown
   */
  static isLoadingShown<T>(fixture: ComponentFixture<T>): boolean {
    return this.elementExists(fixture, '.loading, .spinner, mat-spinner, .loading-indicator');
  }

  /**
   * Simulate form submission
   */
  static submitForm<T>(fixture: ComponentFixture<T>, formSelector: string = 'form'): void {
    const form = this.findElement(fixture, formSelector);
    if (form) {
      form.nativeElement.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    }
  }

  /**
   * Mock localStorage for testing
   */
  static mockLocalStorage() {
    const store: { [key: string]: string } = {};
    
    return {
      getItem: jasmine.createSpy('getItem').and.callFake((key: string) => store[key] || null),
      setItem: jasmine.createSpy('setItem').and.callFake((key: string, value: string) => store[key] = value),
      removeItem: jasmine.createSpy('removeItem').and.callFake((key: string) => delete store[key]),
      clear: jasmine.createSpy('clear').and.callFake(() => Object.keys(store).forEach(key => delete store[key])),
      length: Object.keys(store).length,
      key: jasmine.createSpy('key').and.callFake((index: number) => Object.keys(store)[index] || null)
    };
  }

  /**
   * Create JWT token for testing
   */
  static createMockJwtToken(payload: any = {}, expiresInHours: number = 1): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
    const fullPayload = { exp, ...payload };
    
    return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(fullPayload))}.mock-signature`;
  }

  /**
   * Create expired JWT token for testing
   */
  static createExpiredJwtToken(payload: any = {}): string {
    return this.createMockJwtToken(payload, -1); // Expired 1 hour ago
  }

  /**
   * Assert that spy was called with specific arguments
   */
  static expectSpyToHaveBeenCalledWithArgs(spy: jasmine.Spy, ...args: any[]): void {
    expect(spy).toHaveBeenCalledWith(...args);
  }

  /**
   * Assert that element contains specific text
   */
  static expectElementToContainText<T>(fixture: ComponentFixture<T>, selector: string, text: string): void {
    const elementText = this.getElementText(fixture, selector);
    expect(elementText).toContain(text);
  }

  /**
   * Assert that form is valid
   */
  static expectFormToBeValid(component: any): void {
    expect(component.formGroup?.valid).toBe(true);
  }

  /**
   * Assert that form is invalid
   */
  static expectFormToBeInvalid(component: any): void {
    expect(component.formGroup?.valid).toBe(false);
  }
}
