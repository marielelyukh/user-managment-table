import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { UserDataService } from './user-data.service';
import { IndexedDbService } from './indexed-db.service';
import { mockUsers, mockUserResponse } from '../mocks/indexed-db.service.mocks';

describe('UserDataService', () => {
  let service: UserDataService;
  let httpMock: HttpTestingController;
  let indexedDbService: jasmine.SpyObj<IndexedDbService>;

  beforeEach(() => {
    const indexedDbServiceSpy = jasmine.createSpyObj('IndexedDbService', [
      'getUsersCount',
      'saveUsers',
      'getUsers'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserDataService,
        { provide: IndexedDbService, useValue: indexedDbServiceSpy }
      ]
    });

    service = TestBed.inject(UserDataService);
    httpMock = TestBed.inject(HttpTestingController);
    indexedDbService = TestBed.inject(IndexedDbService) as jasmine.SpyObj<IndexedDbService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeData', () => {
    it('should return void when data already exists in IndexedDB', () => {
      indexedDbService.getUsersCount.and.returnValue(of(10));

      service.initializeData().subscribe(result => {
        expect(result).toBeUndefined();
      });

      expect(indexedDbService.getUsersCount).toHaveBeenCalled();
      expect(indexedDbService.saveUsers).not.toHaveBeenCalled();
    });

    it('should load and store users from local JSON when IndexedDB is empty', () => {
      indexedDbService.getUsersCount.and.returnValue(of(0));
      indexedDbService.saveUsers.and.returnValue(of(void 0));

      service.initializeData().subscribe();

      const localReq = httpMock.expectOne('/assets/users.json');
      expect(localReq.request.method).toBe('GET');
      localReq.flush(mockUserResponse);

      expect(indexedDbService.saveUsers).toHaveBeenCalled();
    });

    it('should handle error when local JSON fails to load', () => {
      indexedDbService.getUsersCount.and.returnValue(of(0));

      service.initializeData().subscribe();

      const localReq = httpMock.expectOne('/assets/users.json');
      localReq.error(new ErrorEvent('Not found'));

      expect(indexedDbService.saveUsers).not.toHaveBeenCalled();
    });

    it('should not save users when local JSON returns empty array', () => {
      indexedDbService.getUsersCount.and.returnValue(of(0));

      service.initializeData().subscribe();

      const localReq = httpMock.expectOne('/assets/users.json');
      localReq.flush([]);

      expect(indexedDbService.saveUsers).not.toHaveBeenCalled();
    });
  });

  describe('getUsers', () => {
    it('should return users from IndexedDB', () => {
      indexedDbService.getUsers.and.returnValue(of(mockUsers));

      service.getUsers(0, 10).subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      expect(indexedDbService.getUsers).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('transformUser', () => {
    it('should transform UserResponse to User', () => {
      const userResponse = mockUserResponse[0];
      const result = service['transformUser'](userResponse);

      expect(result.id).toBe('1');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.dateOfBirth).toEqual(new Date('1990-09-09'));
      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.active).toBe(true);
    });
  });

  describe('transformUsers', () => {
    it('should transform array of UserResponse to User', () => {
      const result = service['transformUsers'](mockUserResponse);

      expect(result.length).toBe(3);
      expect(result[0].firstName).toBe('John');
      expect(result[1].firstName).toBe('Jane');
      expect(result[2].firstName).toBe('Bob');
    });
  });
});

