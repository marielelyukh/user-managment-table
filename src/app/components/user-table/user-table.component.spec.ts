import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError, Observable } from 'rxjs';
import { UserTableComponent } from './user-table.component';
import { UserDataService } from '../../services/user-data.service';
import { SortField, SortOrder, ActiveFilter, AgeFilter } from '../../models/filter.model';
import { mockUsers } from '../../mocks/indexed-db.service.mocks';

describe('UserTableComponent', () => {
  let component: UserTableComponent;
  let fixture: ComponentFixture<UserTableComponent>;
  let userDataService: jasmine.SpyObj<UserDataService>;

  beforeEach(async () => {
    const userDataServiceSpy = jasmine.createSpyObj('UserDataService', ['initializeData', 'getUsers']);

    userDataServiceSpy.initializeData.and.returnValue(new Observable<void>(observer => { observer.next(); observer.complete(); }));
    userDataServiceSpy.getUsers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UserTableComponent],
      providers: [
        { provide: UserDataService, useValue: userDataServiceSpy },
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserTableComponent);
    component = fixture.componentInstance;
    userDataService = TestBed.inject(UserDataService) as jasmine.SpyObj<UserDataService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize data and setup search and scroll', () => {
      userDataService.initializeData.and.returnValue(new Observable<void>(observer => { observer.next(); observer.complete(); }));
      userDataService.getUsers.and.returnValue(of(mockUsers));

      component.ngOnInit();

      expect(userDataService.initializeData).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete all subjects and unsubscribe', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const destroyCompleteSpy = spyOn(component['destroy$'], 'complete');
      const searchCompleteSpy = spyOn(component['searchSubject$'], 'complete');
      const scrollCompleteSpy = spyOn(component['scrollSubject$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(destroyCompleteSpy).toHaveBeenCalled();
      expect(searchCompleteSpy).toHaveBeenCalled();
      expect(scrollCompleteSpy).toHaveBeenCalled();
    });
  });

  describe('onActiveFilterChange', () => {
    beforeEach(() => {
      component['allLoadedUsers'] = mockUsers;
    });

    it('should update active filter and apply filters', () => {
      component.activeFilter = ActiveFilter.All;

      component.onActiveFilterChange(ActiveFilter.Active);

      expect(component.activeFilter).toBe(ActiveFilter.Active);
    });
  });

  describe('onAgeFilterChange', () => {
    beforeEach(() => {
      component['allLoadedUsers'] = mockUsers;
    });

    it('should update age filter and apply filters', () => {
      component.ageFilter = AgeFilter.All;

      component.onAgeFilterChange(AgeFilter.Under18);

      expect(component.ageFilter).toBe(AgeFilter.Under18);
    });
  });

  describe('onSort', () => {
    beforeEach(() => {
      component['allLoadedUsers'] = mockUsers;
    });

    it('should set sort field and order to ascending when field is different', () => {
      component.sortField = null;
      component.sortOrder = null;

      component.onSort(SortField.FirstName);

      expect(component.sortField!).toBe(SortField.FirstName);
      expect(component.sortOrder!).toBe(SortOrder.Asc);
    });

    it('should change from ascending to descending when same field is clicked', () => {
      component.sortField = SortField.FirstName;
      component.sortOrder = SortOrder.Asc;

      component.onSort(SortField.FirstName);

      expect(component.sortField!).toBe(SortField.FirstName);
      expect(component.sortOrder!).toBe(SortOrder.Desc);
    });

    it('should clear sort when descending is clicked again', () => {
      component.sortField = SortField.FirstName;
      component.sortOrder = SortOrder.Desc;

      component.onSort(SortField.FirstName);

      expect(component.sortField).toBeNull();
      expect(component.sortOrder).toBeNull();
    });
  });

  describe('applySearchFilter', () => {
    beforeEach(() => {
      component['allLoadedUsers'] = mockUsers;
    });

    it('should return all users when search query is empty', () => {
      component.searchQuery = '';

      const result = component['applySearchFilter'](mockUsers);

      expect(result.length).toBe(mockUsers.length);
    });

    it('should filter users by last name', () => {
      component.searchQuery = 'smith';

      const result = component['applySearchFilter'](mockUsers);

      expect(result.length).toBe(1);
      expect(result[0].lastName).toBe('Smith');
    });

    it('should filter users by phone number', () => {
      component.searchQuery = '1234567890';

      const result = component['applySearchFilter'](mockUsers);

      expect(result.length).toBe(1);
      expect(result[0].phoneNumber).toBe('+1234567890');
    });
  });

  describe('applyActiveFilter', () => {
    it('should return all users when filter is All', () => {
      component.activeFilter = ActiveFilter.All;

      const result = component['applyActiveFilter'](mockUsers);

      expect(result.length).toBe(mockUsers.length);
    });

    it('should filter active users', () => {
      component.activeFilter = ActiveFilter.Active;

      const result = component['applyActiveFilter'](mockUsers);

      expect(result.every(user => user.active)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should filter inactive users', () => {
      component.activeFilter = ActiveFilter.Inactive;

      const result = component['applyActiveFilter'](mockUsers);

      expect(result.every(user => !user.active)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('applyAgeFilter', () => {
    it('should return all users when filter is All', () => {
      component.ageFilter = AgeFilter.All;

      const result = component['applyAgeFilter'](mockUsers);

      expect(result.length).toBe(mockUsers.length);
    });

    it('should filter users under 18', () => {
      component.ageFilter = AgeFilter.Under18;

      const result = component['applyAgeFilter'](mockUsers);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter users over 18', () => {
      component.ageFilter = AgeFilter.Over18;

      const result = component['applyAgeFilter'](mockUsers);

      expect(result.length).toBe(2);
      expect(result.every(user => user.id !== '2')).toBe(true);
    });
  });

  describe('applySort', () => {
    it('should return unsorted users when no sort field is set', () => {
      component.sortField = null;
      component.sortOrder = null;

      const result = component['applySort'](mockUsers);

      expect(result).toEqual(mockUsers);
    });

    it('should sort by first name ascending', () => {
      component.sortField = SortField.FirstName;
      component.sortOrder = SortOrder.Asc;

      const result = component['applySort'](mockUsers);

      expect(result[0].firstName).toBe('Bob');
      expect(result[1].firstName).toBe('Jane');
      expect(result[2].firstName).toBe('John');
    });

    it('should sort by first name descending', () => {
      component.sortField = SortField.FirstName;
      component.sortOrder = SortOrder.Desc;

      const result = component['applySort'](mockUsers);

      expect(result[0].firstName).toBe('John');
      expect(result[1].firstName).toBe('Jane');
      expect(result[2].firstName).toBe('Bob');
    });

    it('should sort by last name ascending', () => {
      component.sortField = SortField.LastName;
      component.sortOrder = SortOrder.Asc;

      const result = component['applySort'](mockUsers);

      expect(result[0].lastName).toBe('Doe');
      expect(result[1].lastName).toBe('Johnson');
      expect(result[2].lastName).toBe('Smith');
    });

    it('should sort by date of birth ascending', () => {
      component.sortField = SortField.DateOfBirth;
      component.sortOrder = SortOrder.Asc;

      const result = component['applySort'](mockUsers);

      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('2');
    });
  });

  describe('getHighlightedText', () => {
    it('should return highlighted text', () => {
      component.searchQuery = 'john';

      const result = component.getHighlightedText('John Doe');

      expect(result).toContain('<span class="highlight">John</span>');
    });
  });

  describe('getFormattedDate', () => {
    it('should return formatted date', () => {
      const date = new Date('1990-01-01');

      const result = component.getFormattedDate(date);

      expect(result).toBe('01 January 1990');
    });
  });

  describe('loadMoreUsers', () => {
    beforeEach(() => {
      component['allLoadedUsers'] = [];
      component['currentOffset'] = 0;
      component.hasMoreData = true;
      component.loading = false;
    });

    it('should load more users and update state', (done) => {
      userDataService.getUsers.and.returnValue(of(mockUsers));

      component['loadMoreUsers']().subscribe({
        complete: () => {
          expect(userDataService.getUsers).toHaveBeenCalledWith(0, 50);
          expect(component['allLoadedUsers'].length).toBe(3);
          expect(component['currentOffset']).toBe(3);
          done();
        }
      });
    });

    it('should set hasMoreData to false when no more users', (done) => {
      userDataService.getUsers.and.returnValue(of([]));

      component['loadMoreUsers']().subscribe({
        complete: () => {
          expect(component.hasMoreData).toBe(false);
          done();
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle Error in initializeData', () => {
      const error = new Error('Initialization failed');
      userDataService.initializeData.and.returnValue(throwError(() => error));

      component['initializeData']();

      expect(component.loading).toBe(false);
      expect(component.initialized).toBe(true);
    });

    it('should handle DOMException in initializeData', () => {
      const error = new DOMException('DOM error');
      userDataService.initializeData.and.returnValue(throwError(() => error));

      component['initializeData']();

      expect(component.loading).toBe(false);
      expect(component.initialized).toBe(true);
    });
  });
});

