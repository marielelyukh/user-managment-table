import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { User, UserResponse } from '../models/user.model';
import { IndexedDbService } from './indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private readonly localJsonUrl = '/assets/users.json';

  constructor(
    private http: HttpClient,
    private indexedDb: IndexedDbService
  ) {}

  initializeData(): Observable<void> {
    return this.indexedDb.getUsersCount().pipe(
      switchMap(count => {
        if (count === 0) {
          return this.loadAndStoreUsers();
        }
        return of(void 0);
      })
    );
  }

  private loadAndStoreUsers(): Observable<void> {
    return this.http.get<UserResponse[]>(this.localJsonUrl).pipe(
      switchMap(response => {
        if (response && response.length > 0) {
          const users = this.transformUsers(response);
          return this.indexedDb.saveUsers(users);
        }
        return of(void 0);
      }),
      catchError((error: HttpErrorResponse | Error) => {
        return of(void 0);
      })
    );
  }

  private transformUsers(responses: UserResponse[]): User[] {
    return responses.map(response => this.transformUser(response));
  }

  private transformUser(response: UserResponse): User {
    return {
      id: response.id,
      firstName: response.first_name,
      lastName: response.last_name,
      dateOfBirth: new Date(response.date_of_birth),
      phoneNumber: response.phone_number,
      active: response.active
    };
  }

  getUsers(offset: number, limit: number): Observable<User[]> {
    return this.indexedDb.getUsers(offset, limit);
  }
}

