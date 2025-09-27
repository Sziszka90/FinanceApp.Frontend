import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTransactionDto } from '../models/TransactionDtos/create-transaction.dto';
import { GetTransactionDto } from 'src/models/TransactionDtos/get-transaction.dto';
import { UpdateTransactionDto } from 'src/models/TransactionDtos/update-transaction.dto';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { CreateTransactionGroupDto } from 'src/models/TransactionGroupDtos/create-transaction-group.dto';
import { UpdateTransactionGroupDto } from 'src/models/TransactionGroupDtos/update-transaction-group.dto';
import { Money } from 'src/models/Money/money.dto';

@Injectable({
  providedIn: 'root'
})
export class TransactionApiService {

  private apiUrl = environment?.apiUrl ?? '';


  constructor(private http: HttpClient) { }

  getTransaction(id: string): Observable<GetTransactionDto> {
    return this.http.get<GetTransactionDto>(`${this.apiUrl}/api/v1/transactions/${id}`, { withCredentials: true });
  }

  getAllTransactions(): Observable<GetTransactionDto[]> {
    return this.http.get<GetTransactionDto[]>(`${this.apiUrl}/api/v1/transactions/`, { withCredentials: true });
  }

  getAllTransactionsSummary(): Observable<Money> {
    return this.http.get<Money>(`${this.apiUrl}/api/v1/transactions/summary`, { withCredentials: true });
  }

  createTransaction(createTransactionDto:CreateTransactionDto): Observable<GetTransactionDto> {
    return this.http.post<GetTransactionDto>(`${this.apiUrl}/api/v1/transactions/`, createTransactionDto, { withCredentials: true });
  }

  updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto): Observable<GetTransactionDto> {
    return this.http.put<GetTransactionDto>(`${this.apiUrl}/api/v1/transactions/${id}`, updateTransactionDto, { withCredentials: true });
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/transactions/${id}`, { withCredentials: true });
  }

  getAllTransactionGroups(): Observable<GetTransactionGroupDto[]> {
    return this.http.get<GetTransactionGroupDto[]>(`${this.apiUrl}/api/v1/transactiongroups`, { withCredentials: true });
  }

  getTransactionGroup(id: string): Observable<GetTransactionGroupDto> {
    return this.http.get<GetTransactionGroupDto>(`${this.apiUrl}/api/v1/transactiongroups/${id}`, { withCredentials: true });
  }

  createTransactionGroup(createTransactionGroupDto:CreateTransactionGroupDto): Observable<GetTransactionGroupDto> {
    return this.http.post<GetTransactionGroupDto>(`${this.apiUrl}/api/v1/transactiongroups/`, createTransactionGroupDto, { withCredentials: true });
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

  uploadCsv(file: File, correlationId: string): Observable<GetTransactionDto[]> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('correlationId', correlationId);

    return this.http.post<GetTransactionDto[]>(`${this.apiUrl}/api/v1/transactions/import`, formData, { withCredentials: true });
  }
}
