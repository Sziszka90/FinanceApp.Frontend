import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTransactionDto } from '../models/TransactionDtos/create-transaction.dto';
import { GetTransactionDto } from 'src/models/TransactionDtos/get-transaction.dto';
import { UpdateTransactionDto } from 'src/models/TransactionDtos/update-transaction.dto';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { CreateTransactionGroupDto } from 'src/models/TransactionGroupDtos/create-transaction-group.dto';
import { UpdateTransactionGroupDto } from 'src/models/TransactionGroupDtos/update-transaction-group.dto';
import { TopTransactionGroupDto } from 'src/models/TransactionGroupDtos/top-transaction-group.dto';
import { Money } from 'src/models/Money/money.dto';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import {
  TransactionCursorPageDto,
  TransactionPageFilter
} from 'src/models/TransactionDtos/transaction-cursor-page.dto';
import { PdfImportStatusDto } from 'src/models/TransactionDtos/pdf-import-status.dto';

@Injectable({
  providedIn: 'root'
})
export class TransactionApiService {
  private apiUrl = environment?.apiUrl ?? '';

  constructor(private http: HttpClient) {}

  getTransaction(id: string): Observable<GetTransactionDto> {
    return this.http.get<GetTransactionDto>(`${this.apiUrl}/api/v1/transactions/${id}`, { withCredentials: true });
  }

  getAllTransactions(): Observable<GetTransactionDto[]> {
    return this.http.get<GetTransactionDto[]>(`${this.apiUrl}/api/v1/transactions/`, { withCredentials: true });
  }

  getTransactionsPage(
    pageSize = 50,
    cursor?: string | null,
    filter?: TransactionPageFilter
  ): Observable<TransactionCursorPageDto> {
    let params = new HttpParams().set('pageSize', pageSize);
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    if (filter?.transactionName) {
      params = params.set('transactionFilter.transactionName', filter.transactionName);
    }
    if (filter?.transactionDate) {
      params = params.set('transactionFilter.transactionDate', filter.transactionDate);
    }
    if (filter?.transactionType) {
      // The API expects the enum name, while the frontend enum uses numeric values.
      params = params.set('transactionFilter.transactionType', TransactionTypeEnum[filter.transactionType]);
    }

    return this.http.get<TransactionCursorPageDto>(`${this.apiUrl}/api/v1/transactions/page`, {
      params,
      withCredentials: true
    });
  }

  getAllTransactionsSummary(): Observable<Money> {
    return this.http.get<Money>(`${this.apiUrl}/api/v1/transactions/summary`, { withCredentials: true });
  }

  createTransaction(createTransactionDto: CreateTransactionDto): Observable<GetTransactionDto> {
    return this.http.post<GetTransactionDto>(`${this.apiUrl}/api/v1/transactions/`, createTransactionDto, {
      withCredentials: true
    });
  }

  updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto): Observable<GetTransactionDto> {
    return this.http.put<GetTransactionDto>(`${this.apiUrl}/api/v1/transactions/${id}`, updateTransactionDto, {
      withCredentials: true
    });
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/transactions/${id}`, { withCredentials: true });
  }

  getAllTransactionGroups(): Observable<GetTransactionGroupDto[]> {
    return this.http.get<GetTransactionGroupDto[]>(`${this.apiUrl}/api/v1/transactiongroups`, {
      withCredentials: true
    });
  }

  getTransactionGroup(id: string): Observable<GetTransactionGroupDto> {
    return this.http.get<GetTransactionGroupDto>(`${this.apiUrl}/api/v1/transactiongroups/${id}`, {
      withCredentials: true
    });
  }

  createTransactionGroup(createTransactionGroupDto: CreateTransactionGroupDto): Observable<GetTransactionGroupDto> {
    return this.http.post<GetTransactionGroupDto>(
      `${this.apiUrl}/api/v1/transactiongroups/`,
      createTransactionGroupDto,
      { withCredentials: true }
    );
  }

  updateTransactionGroup(
    id: string,
    updateTransactionGroupDto: UpdateTransactionGroupDto
  ): Observable<GetTransactionGroupDto> {
    return this.http.put<GetTransactionGroupDto>(
      `${this.apiUrl}/api/v1/transactiongroups/${id}`,
      updateTransactionGroupDto,
      { withCredentials: true }
    );
  }

  deleteTransactionGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/transactiongroups/${id}`, { withCredentials: true });
  }

  getTopTransactionGroups(
    startDate: Date,
    endDate: Date,
    userId?: string,
    top?: number
  ): Observable<TopTransactionGroupDto[]> {
    const params: Record<string, string | number> = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    if (userId) {
      params['userId'] = userId;
    }

    if (top !== undefined && top !== null) {
      params['top'] = top.toString();
    }

    return this.http.get<TopTransactionGroupDto[]>(`${this.apiUrl}/api/v1/transactiongroups/top`, {
      params,
      withCredentials: true
    });
  }

  uploadPdf(file: File, correlationId: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('correlationId', correlationId);

    return this.http.post<string>(`${this.apiUrl}/api/v1/transactions/import`, formData, { withCredentials: true });
  }

  getPdfImportStatus(correlationId: string): Observable<PdfImportStatusDto> {
    return this.http.get<PdfImportStatusDto>(`${this.apiUrl}/api/v1/transactions/import/${correlationId}/status`, {
      withCredentials: true
    });
  }
}
