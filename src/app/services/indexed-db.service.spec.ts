import { TestBed } from '@angular/core/testing';
import { IndexedDbService } from './indexed-db.service';
import { User } from '../models/user.model';
import { of, throwError } from 'rxjs';
import { createMockStore, createMockTransaction, createMockDatabase, createMockOpenDBRequest, mockUsers } from '../mocks/indexed-db.service.mocks';

describe('IndexedDbService', () => {
  let service: IndexedDbService;
  let mockDb: IDBDatabase;
  let mockTransaction: IDBTransaction;
  let mockStore: IDBObjectStore;
  let mockRequest: IDBOpenDBRequest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IndexedDbService]
    });

    service = TestBed.inject(IndexedDbService);

    mockStore = createMockStore();
    mockTransaction = createMockTransaction(mockStore);
    mockDb = createMockDatabase(mockTransaction, mockStore);
    mockRequest = createMockOpenDBRequest(mockDb);
  });

  afterEach(() => {
    if (service['db']) {
      service['db'] = null;
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should initialize IndexedDB successfully', (done) => {
      spyOn(indexedDB, 'open').and.returnValue(mockRequest);

      service.init().subscribe({
        next: () => {
          expect(service['db']).toBe(mockDb);
          done();
        },
        error: done.fail
      });

      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({} as Event);
      }
    });

    it('should handle initialization error', (done) => {
      const error = new Error('IndexedDB initialization failed');
      const errorRequest = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        onblocked: null
      } as unknown as IDBOpenDBRequest;
      spyOn(indexedDB, 'open').and.returnValue(errorRequest);

      service.init().subscribe({
        next: () => done.fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });

      if (errorRequest.onerror) {
        errorRequest.onerror({} as Event);
      }
    });

    it('should handle DOMException during initialization', (done) => {
      const error = new DOMException('QuotaExceededError');
      const errorRequest = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        onblocked: null
      } as unknown as IDBOpenDBRequest;
      spyOn(indexedDB, 'open').and.returnValue(errorRequest);

      service.init().subscribe({
        next: () => done.fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });

      if (errorRequest.onerror) {
        errorRequest.onerror({} as Event);
      }
    });

    it('should create object store on upgrade', () => {
      const upgradeEvent = {
        target: mockRequest,
        oldVersion: 0,
        newVersion: 1
      } as unknown as IDBVersionChangeEvent;

      spyOn(indexedDB, 'open').and.returnValue(mockRequest);

      service.init().subscribe();

      if (mockRequest.onupgradeneeded) {
        mockRequest.onupgradeneeded(upgradeEvent);
      }

      expect(mockDb.createObjectStore).toHaveBeenCalled();
    });
  });

  describe('saveUsers', () => {
    beforeEach(() => {
      service['db'] = mockDb;
    });

    it('should save users successfully', (done) => {
      const putRequests: IDBRequest[] = [];
      for (let i = 0; i < mockUsers.length; i++) {
        const req = {
          result: mockUsers[i],
          error: null,
          onsuccess: null,
          onerror: null
        } as IDBRequest;
        putRequests.push(req);
        (mockStore.put as jasmine.Spy).and.returnValue(req);
      }

      service.saveUsers(mockUsers).subscribe({
        next: () => {
          expect(mockStore.put).toHaveBeenCalledTimes(mockUsers.length);
          done();
        },
        error: done.fail
      });

      putRequests.forEach(req => {
        if (req.onsuccess) {
          req.onsuccess({} as Event);
        }
      });
    });

    it('should handle error during save', (done) => {
      const error = new Error('Failed to save user');
      const req = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.put as jasmine.Spy).and.returnValue(req);

      service.saveUsers(mockUsers).subscribe({
        next: () => done.fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });

      if (req.onerror) {
        req.onerror({} as Event);
      }
    });

    it('should handle DOMException during save', (done) => {
      const error = new DOMException('QuotaExceededError');
      const req = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.put as jasmine.Spy).and.returnValue(req);

      service.saveUsers(mockUsers).subscribe({
        next: () => done.fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });

      if (req.onerror) {
        req.onerror({} as Event);
      }
    });
  });

  describe('getUsersCount', () => {
    beforeEach(() => {
      service['db'] = mockDb;
    });

    it('should return user count successfully', (done) => {
      const countRequest = {
        result: 10,
        error: null,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.count as jasmine.Spy).and.returnValue(countRequest);

      service.getUsersCount().subscribe({
        next: (count) => {
          expect(count).toBe(10);
          done();
        },
        error: done.fail
      });

      if (countRequest.onsuccess) {
        countRequest.onsuccess({} as Event);
      }
    });

    it('should return 0 on error', (done) => {
      const error = new Error('IndexedDB operation failed');
      const countRequest = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.count as jasmine.Spy).and.returnValue(countRequest);

      service.getUsersCount().subscribe({
        next: (count) => {
          expect(count).toBe(0);
          done();
        },
        error: done.fail
      });

      if (countRequest.onerror) {
        countRequest.onerror({} as Event);
      }
    });

    it('should return 0 on DOMException', (done) => {
      const error = new DOMException('QuotaExceededError');
      const countRequest = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.count as jasmine.Spy).and.returnValue(countRequest);

      service.getUsersCount().subscribe({
        next: (count) => {
          expect(count).toBe(0);
          done();
        },
        error: done.fail
      });

      if (countRequest.onerror) {
        countRequest.onerror({} as Event);
      }
    });

    it('should handle try-catch errors', (done) => {
      (mockDb.transaction as jasmine.Spy).and.throwError(new Error('Transaction failed'));

      service.getUsersCount().subscribe({
        next: (count) => {
          expect(count).toBe(0);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getUsers', () => {
    beforeEach(() => {
      service['db'] = mockDb;
    });

    it('should return users with offset and limit', (done) => {
      let cursorIndex = 0;
      const cursorRequest: any = {
        result: null as IDBCursorWithValue | null,
        error: null,
        onsuccess: null,
        onerror: null
      };

      const createCursor = () => {
        if (cursorIndex < mockUsers.length) {
          cursorRequest.result = {
            value: mockUsers[cursorIndex],
            continue: jasmine.createSpy('continue')
          } as unknown as IDBCursorWithValue;
          cursorIndex++;
          if (cursorRequest.onsuccess) {
            cursorRequest.onsuccess({} as Event);
          }
        } else {
          cursorRequest.result = null;
          if (cursorRequest.onsuccess) {
            cursorRequest.onsuccess({} as Event);
          }
        }
      };

      (mockStore.openCursor as jasmine.Spy).and.returnValue(cursorRequest);
      cursorRequest.onsuccess = createCursor;

      service.getUsers(0, 2).subscribe({
        next: (users) => {
          expect(users.length).toBe(2);
          expect(users[0]).toEqual(mockUsers[0]);
          expect(users[1]).toEqual(mockUsers[1]);
          done();
        },
        error: done.fail
      });

      createCursor();
    });

    it('should skip users based on offset', (done) => {
      let cursorIndex = 0;
      const cursorRequest: any = {
        result: null as IDBCursorWithValue | null,
        error: null,
        onsuccess: null,
        onerror: null
      };

      const createCursor = () => {
        if (cursorIndex < mockUsers.length) {
          cursorRequest.result = {
            value: mockUsers[cursorIndex],
            continue: jasmine.createSpy('continue')
          } as unknown as IDBCursorWithValue;
          cursorIndex++;
          if (cursorRequest.onsuccess) {
            cursorRequest.onsuccess({} as Event);
          }
        } else {
          cursorRequest.result = null;
          if (cursorRequest.onsuccess) {
            cursorRequest.onsuccess({} as Event);
          }
        }
      };

      (mockStore.openCursor as jasmine.Spy).and.returnValue(cursorRequest);
      cursorRequest.onsuccess = createCursor;

      service.getUsers(1, 1).subscribe({
        next: (users) => {
          expect(users.length).toBe(1);
          expect(users[0]).toEqual(mockUsers[1]);
          done();
        },
        error: done.fail
      });

      createCursor();
    });

    it('should return empty array on error', (done) => {
      const error = new Error('IndexedDB operation failed');
      const cursorRequest = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.openCursor as jasmine.Spy).and.returnValue(cursorRequest);

      service.getUsers(0, 10).subscribe({
        next: (users) => {
          expect(users).toEqual([]);
          done();
        },
        error: done.fail
      });

      if (cursorRequest.onerror) {
        cursorRequest.onerror({} as Event);
      }
    });

    it('should return empty array on DOMException', (done) => {
      const error = new DOMException('QuotaExceededError');
      const cursorRequest = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.openCursor as jasmine.Spy).and.returnValue(cursorRequest);

      service.getUsers(0, 10).subscribe({
        next: (users) => {
          expect(users).toEqual([]);
          done();
        },
        error: done.fail
      });

      if (cursorRequest.onerror) {
        cursorRequest.onerror({} as Event);
      }
    });

    it('should handle try-catch errors', (done) => {
      (mockDb.transaction as jasmine.Spy).and.throwError(new Error('Transaction failed'));

      service.getUsers(0, 10).subscribe({
        next: (users) => {
          expect(users).toEqual([]);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('clearAll', () => {
    beforeEach(() => {
      service['db'] = mockDb;
    });

    it('should clear all users successfully', (done) => {
      const clearRequest = {
        result: undefined,
        error: null,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.clear as jasmine.Spy).and.returnValue(clearRequest);

      service.clearAll().subscribe({
        next: () => {
          expect(mockStore.clear).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });

      if (clearRequest.onsuccess) {
        clearRequest.onsuccess({} as Event);
      }
    });

    it('should handle error during clear', (done) => {
      const error = new Error('IndexedDB operation failed');
      const clearRequest = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.clear as jasmine.Spy).and.returnValue(clearRequest);

      service.clearAll().subscribe({
        next: () => done.fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });

      if (clearRequest.onerror) {
        clearRequest.onerror({} as Event);
      }
    });

    it('should handle DOMException during clear', (done) => {
      const error = new DOMException('QuotaExceededError');
      const clearRequest = {
        result: null,
        error: error,
        onsuccess: null,
        onerror: null
      } as IDBRequest;
      (mockStore.clear as jasmine.Spy).and.returnValue(clearRequest);

      service.clearAll().subscribe({
        next: () => done.fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });

      if (clearRequest.onerror) {
        clearRequest.onerror({} as Event);
      }
    });
  });

  describe('ensureDb', () => {
    it('should return void when db is already initialized', (done) => {
      service['db'] = mockDb;

      service['ensureDb']().subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });
    });

    it('should call init when db is not initialized', () => {
      service['db'] = null;
      const initSpy = spyOn(service, 'init').and.returnValue(of(void 0));

      service['ensureDb']().subscribe();

      expect(initSpy).toHaveBeenCalled();
    });
  });
});

