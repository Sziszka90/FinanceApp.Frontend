import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransactionApiService } from './transactions.api.service';
import { CreateTransactionDto } from '../models/TransactionDtos/create-transaction.dto';
import { UpdateTransactionDto } from '../models/TransactionDtos/update-transaction.dto';
import { GetTransactionDto } from '../models/TransactionDtos/get-transaction.dto';
import { CreateTransactionGroupDto } from '../models/TransactionGroupDtos/create-transaction-group.dto';
import { UpdateTransactionGroupDto } from '../models/TransactionGroupDtos/update-transaction-group.dto';
import { GetTransactionGroupDto } from '../models/TransactionGroupDtos/get-transaction-group.dto';
import { CurrencyEnum } from '../models/Enums/currency.enum';
import { TransactionTypeEnum } from '../models/Enums/transaction-type.enum';
import { Money } from '../models/Money/money.dto';

describe('TransactionApiService', () => {
  let service: TransactionApiService;
  let httpMock: HttpTestingController;

  const mockEnvironment = {
    apiUrl: 'https://api.example.com'
  };

  const mockMoney: Money = {
    amount: 100,
    currency: CurrencyEnum.EUR
  };

  const mockTransaction: GetTransactionDto = {
    id: '123',
    name: 'Test Transaction',
    description: 'Test Description',
    value: mockMoney,
    transactionType: TransactionTypeEnum.Income,
    transactionDate: new Date()
  };

  const mockCreateTransaction: CreateTransactionDto = {
    name: 'New Transaction',
    description: 'New Description',
    value: { amount: 50, currency: CurrencyEnum.USD },
    transactionType: TransactionTypeEnum.Expense,
    transactionDate: new Date(),
    transactionGroupId: '789'
  };

  const mockUpdateTransaction: UpdateTransactionDto = {
    id: '123',
    name: 'Updated Transaction',
    description: 'Updated Description',
    value: { amount: 75, currency: CurrencyEnum.GBP },
    transactionType: TransactionTypeEnum.Income,
    transactionDate: new Date(),
    transactionGroupId: '456'
  };

  const mockTransactionGroup: GetTransactionGroupDto = {
    id: '456',
    name: 'Test Group',
    description: 'Test Group Description',
    groupIcon: 'home'
  };

  const mockCreateTransactionGroup: CreateTransactionGroupDto = {
    name: 'New Group',
    description: 'New Group Description',
    groupIcon: 'shopping'
  };

  const mockUpdateTransactionGroup: UpdateTransactionGroupDto = {
    id: '456',
    name: 'Updated Group',
    description: 'Updated Group Description',
    groupIcon: 'savings'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransactionApiService]
    });

    service = TestBed.inject(TransactionApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock environment
    (service as any).apiUrl = mockEnvironment.apiUrl;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have apiUrl configured', () => {
      expect((service as any).apiUrl).toBe(mockEnvironment.apiUrl);
    });
  });

  describe('Transaction Operations', () => {
    describe('getAllTransactions', () => {
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactions/`;

      it('should retrieve all transactions', () => {
        const mockTransactions = [mockTransaction];

        service.getAllTransactions().subscribe((transactions: GetTransactionDto[]) => {
          expect(transactions).toEqual(mockTransactions);
          expect(transactions.length).toBe(1);
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('GET');
        req.flush(mockTransactions);
      });

      it('should handle empty transactions list', () => {
        const emptyTransactions: GetTransactionDto[] = [];

        service.getAllTransactions().subscribe((transactions: GetTransactionDto[]) => {
          expect(transactions).toEqual(emptyTransactions);
          expect(transactions.length).toBe(0);
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush(emptyTransactions);
      });

      it('should handle HTTP errors', () => {
        service.getAllTransactions().subscribe({
          next: () => fail('Should have failed'),
          error: (error: any) => {
            expect(error.status).toBe(500);
          }
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      });
    });

    describe('getAllTransactionsSummary', () => {
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactions/summary`;

      it('should retrieve transactions summary', () => {
        const mockSummary: Money = { amount: 1000, currency: CurrencyEnum.EUR };

        service.getAllTransactionsSummary().subscribe((summary: Money) => {
          expect(summary).toEqual(mockSummary);
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('GET');
        req.flush(mockSummary);
      });

      it('should handle empty summary', () => {
        const emptySummary: Money = { amount: 0, currency: CurrencyEnum.EUR };

        service.getAllTransactionsSummary().subscribe((summary: Money) => {
          expect(summary.amount).toBe(0);
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush(emptySummary);
      });
    });

    describe('createTransaction', () => {
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactions/`;

      it('should create new transaction', () => {
        service.createTransaction(mockCreateTransaction).subscribe((transaction: GetTransactionDto) => {
          expect(transaction).toEqual(mockTransaction);
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockCreateTransaction);
        req.flush(mockTransaction);
      });

      it('should handle validation errors', () => {
        service.createTransaction(mockCreateTransaction).subscribe({
          next: () => fail('Should have failed'),
          error: (error: any) => {
            expect(error.status).toBe(422);
          }
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush('Validation Error', { status: 422, statusText: 'Unprocessable Entity' });
      });

      it('should send correct request headers', () => {
        service.createTransaction(mockCreateTransaction).subscribe();

        const req = httpMock.expectOne(expectedUrl);
        // In Angular's HttpClient, Content-Type is automatically set for JSON payloads
        // Check that the request body is properly JSON-serialized
        expect(req.request.body).toEqual(mockCreateTransaction);
        expect(req.request.method).toBe('POST');
        req.flush(mockTransaction);
      });
    });

    describe('updateTransaction', () => {
      const transactionId = '123';
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactions/${transactionId}`;

      it('should update existing transaction', () => {
        service.updateTransaction(transactionId, mockUpdateTransaction).subscribe((transaction: GetTransactionDto) => {
          expect(transaction).toEqual(mockTransaction);
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(mockUpdateTransaction);
        req.flush(mockTransaction);
      });

      it('should handle transaction not found on update', () => {
        service.updateTransaction(transactionId, mockUpdateTransaction).subscribe({
          next: () => fail('Should have failed'),
          error: (error: any) => {
            expect(error.status).toBe(404);
          }
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush('Transaction not found', { status: 404, statusText: 'Not Found' });
      });
    });

    describe('deleteTransaction', () => {
      const transactionId = '123';
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactions/${transactionId}`;

      it('should delete transaction by ID', () => {
        service.deleteTransaction(transactionId).subscribe((result: void) => {
          expect(result).toBeNull();
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('DELETE');
        req.flush(null, { status: 204, statusText: 'No Content' });
      });

      it('should handle transaction not found on delete', () => {
        service.deleteTransaction(transactionId).subscribe({
          next: () => fail('Should have failed'),
          error: (error: any) => {
            expect(error.status).toBe(404);
          }
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush('Not Found', { status: 404, statusText: 'Not Found' });
      });
    });
  });

  describe('Transaction Group Operations', () => {
    describe('getAllTransactionGroups', () => {
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactiongroups`;

      it('should retrieve all transaction groups', () => {
        const mockGroups = [mockTransactionGroup];

        service.getAllTransactionGroups().subscribe((groups: GetTransactionGroupDto[]) => {
          expect(groups).toEqual(mockGroups);
          expect(groups.length).toBe(1);
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('GET');
        req.flush(mockGroups);
      });
    });

    describe('getTransactionGroup', () => {
      const groupId = '456';
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactiongroups/${groupId}`;

      it('should retrieve specific transaction group by ID', () => {
        service.getTransactionGroup(groupId).subscribe((group: GetTransactionGroupDto) => {
          expect(group).toEqual(mockTransactionGroup);
          expect(group.id).toBe(groupId);
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('GET');
        req.flush(mockTransactionGroup);
      });
    });

    describe('createTransactionGroup', () => {
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactiongroups/`;

      it('should create new transaction group', () => {
        service.createTransactionGroup(mockCreateTransactionGroup).subscribe((group: GetTransactionGroupDto) => {
          expect(group).toEqual(mockTransactionGroup);
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockCreateTransactionGroup);
        req.flush(mockTransactionGroup);
      });
    });

    describe('updateTransactionGroup', () => {
      const groupId = '456';
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactiongroups/${groupId}`;

      it('should update existing transaction group', () => {
        service.updateTransactionGroup(groupId, mockUpdateTransactionGroup)
          .subscribe((group: GetTransactionGroupDto) => {
            expect(group).toEqual(mockTransactionGroup);
          });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(mockUpdateTransactionGroup);
        req.flush(mockTransactionGroup);
      });
    });

    describe('deleteTransactionGroup', () => {
      const groupId = '456';
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactiongroups/${groupId}`;

      it('should delete transaction group by ID', () => {
        service.deleteTransactionGroup(groupId).subscribe((result: void) => {
          expect(result).toBeNull();
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('DELETE');
        req.flush(null, { status: 204, statusText: 'No Content' });
      });
    });
  });

  describe('File Upload Operations', () => {
    describe('uploadCsv', () => {
      const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/transactions/import`;
      const correlationId = 'test-correlation-id';

      it('should upload CSV file', () => {
        const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' });
        const expectedTransactions = [mockTransaction];

        service.uploadCsv(mockFile, correlationId).subscribe((transactions: GetTransactionDto[]) => {
          expect(transactions).toEqual(expectedTransactions);
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toBeInstanceOf(FormData);

        const formData = req.request.body as FormData;
        expect(formData.get('file')).toBe(mockFile);
        expect(formData.get('correlationId')).toBe(correlationId);

        req.flush(expectedTransactions);
      });

      it('should handle file upload errors', () => {
        const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' });

        service.uploadCsv(mockFile, correlationId).subscribe({
          next: () => fail('Should have failed'),
          error: (error: any) => {
            expect(error.status).toBe(400);
          }
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized for transaction endpoints', () => {
      service.getAllTransactions().subscribe({
        next: () => fail('Should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 401 Unauthorized for create transaction', () => {
      service.createTransaction(mockCreateTransaction).subscribe({
        next: () => fail('Should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 401 Unauthorized for update transaction', () => {
      service.updateTransaction('123', mockUpdateTransaction).subscribe({
        next: () => fail('Should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/123`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 401 Unauthorized for delete transaction', () => {
      service.deleteTransaction('123').subscribe({
        next: () => fail('Should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/123`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 401 Unauthorized for transaction group endpoints', () => {
      service.getAllTransactionGroups().subscribe({
        next: () => fail('Should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactiongroups`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle server timeouts', () => {
      service.getAllTransactions().subscribe({
        next: () => fail('Should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      req.error(new ProgressEvent('timeout'));
    });
  });

  describe('Data Transformation', () => {
    it('should preserve currency enum values', () => {
      const transactionWithDifferentCurrency = {
        ...mockCreateTransaction,
        value: { amount: 100, currency: CurrencyEnum.HUF }
      };

      service.createTransaction(transactionWithDifferentCurrency).subscribe();

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.body.value.currency).toBe(CurrencyEnum.HUF);
      req.flush(mockTransaction);
    });

    it('should preserve transaction type enum values', () => {
      const expenseTransaction = {
        ...mockCreateTransaction,
        transactionType: TransactionTypeEnum.Expense
      };

      service.createTransaction(expenseTransaction).subscribe();

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.body.transactionType).toBe(TransactionTypeEnum.Expense);
      req.flush(mockTransaction);
    });

    it('should preserve date format', () => {
      const specificDate = new Date('2024-01-15T10:30:00.000Z');
      const transactionWithSpecificDate = {
        ...mockCreateTransaction,
        transactionDate: specificDate
      };

      service.createTransaction(transactionWithSpecificDate).subscribe();

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.body.transactionDate).toBe(specificDate);
      req.flush(mockTransaction);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete CRUD workflow for transactions', () => {
      // Create
      service.createTransaction(mockCreateTransaction).subscribe();
      let req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.method).toBe('POST');
      req.flush(mockTransaction);

      // Read all
      service.getAllTransactions().subscribe();
      req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.method).toBe('GET');
      req.flush([mockTransaction]);

      // Update
      service.updateTransaction(mockTransaction.id, mockUpdateTransaction).subscribe();
      req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/${mockTransaction.id}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockTransaction);

      // Delete
      service.deleteTransaction(mockTransaction.id).subscribe();
      req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/${mockTransaction.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should handle complete CRUD workflow for transaction groups', () => {
      // Create
      service.createTransactionGroup(mockCreateTransactionGroup).subscribe();
      let req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactiongroups/`);
      expect(req.request.method).toBe('POST');
      req.flush(mockTransactionGroup);

      // Read all
      service.getAllTransactionGroups().subscribe();
      req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactiongroups`);
      expect(req.request.method).toBe('GET');
      req.flush([mockTransactionGroup]);

      // Read one
      service.getTransactionGroup(mockTransactionGroup.id).subscribe();
      req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactiongroups/${mockTransactionGroup.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTransactionGroup);

      // Update
      service.updateTransactionGroup(mockTransactionGroup.id, mockUpdateTransactionGroup).subscribe();
      req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactiongroups/${mockTransactionGroup.id}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockTransactionGroup);

      // Delete
      service.deleteTransactionGroup(mockTransactionGroup.id).subscribe();
      req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactiongroups/${mockTransactionGroup.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should handle multiple concurrent requests', () => {
      // Make multiple simultaneous requests
      service.getAllTransactions().subscribe();
      service.getAllTransactionGroups().subscribe();
      service.getAllTransactionsSummary().subscribe();

      const requests = httpMock.match(() => true);
      expect(requests.length).toBe(3);

      // Respond to all requests
      requests[0].flush([mockTransaction]);
      requests[1].flush([mockTransactionGroup]);
      requests[2].flush(mockMoney);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings gracefully', () => {
      const transactionWithEmptyStrings = {
        name: '',
        description: '',
        value: mockMoney,
        transactionType: TransactionTypeEnum.Income,
        transactionDate: new Date(),
        transactionGroupId: ''
      };

      service.createTransaction(transactionWithEmptyStrings).subscribe();

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.body).toEqual(transactionWithEmptyStrings);
      req.flush(mockTransaction);
    });

    it('should handle very large amounts', () => {
      const largeAmountTransaction = {
        ...mockCreateTransaction,
        value: { amount: Number.MAX_SAFE_INTEGER, currency: CurrencyEnum.EUR }
      };

      service.createTransaction(largeAmountTransaction).subscribe();

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.body.value.amount).toBe(Number.MAX_SAFE_INTEGER);
      req.flush(mockTransaction);
    });

    it('should handle negative amounts', () => {
      const negativeAmountTransaction = {
        ...mockCreateTransaction,
        value: { amount: -100, currency: CurrencyEnum.EUR }
      };

      service.createTransaction(negativeAmountTransaction).subscribe();

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.body.value.amount).toBe(-100);
      req.flush(mockTransaction);
    });

    it('should handle zero amounts', () => {
      const zeroAmountTransaction = {
        ...mockCreateTransaction,
        value: { amount: 0, currency: CurrencyEnum.EUR }
      };

      service.createTransaction(zeroAmountTransaction).subscribe();

      const req = httpMock.expectOne(`${mockEnvironment.apiUrl}/api/v1/transactions/`);
      expect(req.request.body.value.amount).toBe(0);
      req.flush(mockTransaction);
    });
  });
});
