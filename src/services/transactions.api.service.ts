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

  // API base URL
  private apiUrl = environment?.apiUrl ?? '';

  constructor(private http: HttpClient) { }

  // Method to get data from the backend
  getAllTransactions(): Observable<GetTransactionDto[]> {
     return this.http.get<GetTransactionDto[]>(`${this.apiUrl}/api/transactions/`);
  }

  getAllTransactionsSummary(): Observable<Money> {
    return this.http.get<Money>(`${this.apiUrl}/api/transactions/summary`);
  }

  createTransaction(createTransactionDto:CreateTransactionDto): Observable<GetTransactionDto> {
    console.log(createTransactionDto);
    return this.http.post<GetTransactionDto>(`${this.apiUrl}/api/transactions/`, createTransactionDto);
  }

  updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto): Observable<GetTransactionDto> {
    console.log(updateTransactionDto);
    return this.http.put<GetTransactionDto>(`${this.apiUrl}/api/transactions/${id}`, updateTransactionDto);
  }

  deleteTransaction(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/transactions/${id}`);
  }

  getAllTransactionGroups(): Observable<GetTransactionGroupDto[]> {
    return this.http.get<GetTransactionGroupDto[]>(`${this.apiUrl}/api/transactiongroups`);
  }

  getTransactionGroup(id: string): Observable<GetTransactionGroupDto> {
    return this.http.get<GetTransactionGroupDto>(`${this.apiUrl}/api/transactiongroups/${id}`);
  }

  createTransactionGroup(createTransactionGroupDto:CreateTransactionGroupDto): Observable<GetTransactionGroupDto> {
    return this.http.post<GetTransactionGroupDto>(`${this.apiUrl}/api/transactiongroups/`, createTransactionGroupDto);
  }

  updateTransactionGroup(id: string, updateTransactionGroupDto:UpdateTransactionGroupDto): Observable<GetTransactionGroupDto> {
    return this.http.put<GetTransactionGroupDto>(`${this.apiUrl}/api/transactiongroups/${id}`, updateTransactionGroupDto);
  }

  deleteTransactionGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/transactiongroups/${id}`);
  }

  uploadCsv(file: File, correlationId: string): Observable<GetTransactionDto[]> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('correlationId', correlationId);

    return this.http.post<GetTransactionDto[]>(`${this.apiUrl}/api/transactions/upload-csv`, formData);
  }
}
