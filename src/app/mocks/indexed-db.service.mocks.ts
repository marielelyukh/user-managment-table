import { User, UserResponse } from '../models/user.model';

export const mockUserResponse: UserResponse[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-09-09',
    phone_number: '+1234567890',
    active: true
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    date_of_birth: '1999-09-09',
    phone_number: '+0987654321',
    active: false
  },
  {
    id: '3',
    first_name: 'Bob',
    last_name: 'Johnson',
    date_of_birth: '1985-03-20',
    phone_number: '+1122334455',
    active: true
  }
];

function transformUserResponseToUser(response: UserResponse): User {
  return {
    id: response.id,
    firstName: response.first_name,
    lastName: response.last_name,
    dateOfBirth: new Date(response.date_of_birth),
    phoneNumber: response.phone_number,
    active: response.active
  };
}

export const mockUsers: User[] = mockUserResponse.map(transformUserResponseToUser);

export function createMockStore(): IDBObjectStore {
  return {
    put: jasmine.createSpy('put').and.returnValue({} as IDBRequest),
    get: jasmine.createSpy('get').and.returnValue({} as IDBRequest),
    count: jasmine.createSpy('count').and.returnValue({} as IDBRequest),
    clear: jasmine.createSpy('clear').and.returnValue({} as IDBRequest),
    openCursor: jasmine.createSpy('openCursor').and.returnValue({} as IDBRequest),
    createIndex: jasmine.createSpy('createIndex'),
    delete: jasmine.createSpy('delete'),
    add: jasmine.createSpy('add')
  } as unknown as IDBObjectStore;
}

export function createMockTransaction(mockStore: IDBObjectStore): IDBTransaction {
  return {
    objectStore: jasmine.createSpy('objectStore').and.returnValue(mockStore)
  } as unknown as IDBTransaction;
}

export function createMockDatabase(mockTransaction: IDBTransaction, mockStore: IDBObjectStore): IDBDatabase {
  return {
    transaction: jasmine.createSpy('transaction').and.returnValue(mockTransaction),
    objectStoreNames: {
      contains: jasmine.createSpy('contains').and.returnValue(false)
    },
    createObjectStore: jasmine.createSpy('createObjectStore').and.returnValue(mockStore)
  } as unknown as IDBDatabase;
}

export function createMockOpenDBRequest(mockDb: IDBDatabase): IDBOpenDBRequest {
  return {
    result: mockDb,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    onblocked: null
  } as unknown as IDBOpenDBRequest;
}

