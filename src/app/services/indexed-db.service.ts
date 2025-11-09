import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private readonly dbName = 'UserTableDB';
  private readonly storeName = 'users';
  private db: IDBDatabase | null = null;

  init(): Observable<void> {
    return new Observable<void>(observer => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        const error = request.error || new Error('IndexedDB initialization failed');
        observer.error(error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        observer.next();
        observer.complete();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
          objectStore.createIndex('firstName', 'firstName', { unique: false });
          objectStore.createIndex('lastName', 'lastName', { unique: false });
          objectStore.createIndex('dateOfBirth', 'dateOfBirth', { unique: false });
          objectStore.createIndex('active', 'active', { unique: false });
        }
      };
    });
  }

  saveUsers(users: User[]): Observable<void> {
    return this.ensureDb().pipe(
      switchMap(() => {
        return new Observable<void>(observer => {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const requests = users.map(user => store.put(user));
          let completed = 0;
          let hasError = false;

          requests.forEach(request => {
            request.onsuccess = () => {
              completed++;
              if (completed === requests.length && !hasError) {
                observer.next();
                observer.complete();
              }
            };
            request.onerror = () => {
              if (!hasError) {
                hasError = true;
                const error = request.error || new Error('Failed to save user');
                observer.error(error);
              }
            };
          });
        });
      }),
      catchError((error: Error | DOMException) => throwError(() => error))
    );
  }

  getUsersCount(): Observable<number> {
    return this.ensureDb().pipe(
      switchMap(() => {
        return new Observable<number>(observer => {
          try {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();
            request.onsuccess = () => {
              observer.next(request.result);
              observer.complete();
            };
            request.onerror = () => {
              const error = request.error || new Error('IndexedDB operation failed');
              observer.error(error);
            };
          } catch (error) {
            observer.error(error);
          }
        });
      }),
      catchError((error: Error | DOMException) => {
        return of(0);
      })
    );
  }

  getUsers(offset: number, limit: number): Observable<User[]> {
    return this.ensureDb().pipe(
      switchMap(() => {
        return new Observable<User[]>(observer => {
          try {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.openCursor();
            const users: User[] = [];
            let skipped = 0;

            request.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
              if (cursor && users.length < limit) {
                if (skipped < offset) {
                  skipped++;
                  cursor.continue();
                } else {
                  users.push(cursor.value);
                  cursor.continue();
                }
              } else {
                observer.next(users);
                observer.complete();
              }
            };

            request.onerror = () => {
              const error = request.error || new Error('IndexedDB operation failed');
              observer.error(error);
            };
          } catch (error) {
            observer.error(error);
          }
        });
      }),
      catchError((error: Error | DOMException) => {
        return of([]);
      })
    );
  }

  clearAll(): Observable<void> {
    return this.ensureDb().pipe(
      switchMap(() => {
        return new Observable<void>(observer => {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();
          request.onsuccess = () => {
            observer.next();
            observer.complete();
          };
          request.onerror = () => {
            const error = request.error || new Error('IndexedDB operation failed');
            observer.error(error);
          };
        });
      }),
      catchError((error: Error | DOMException) => throwError(() => error))
    );
  }

  private ensureDb(): Observable<void> {
    if (this.db) {
      return new Observable<void>(observer => {
        observer.next();
        observer.complete();
      });
    }
    return this.init();
  }
}


