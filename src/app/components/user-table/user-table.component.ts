import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, switchMap, finalize, tap, catchError, Observable, Subscription, EMPTY, ignoreElements } from 'rxjs';
import { User } from '../../models/user.model';
import { SortField, SortOrder, ActiveFilter, AgeFilter } from '../../models/filter.model';
import { UserDataService } from '../../services/user-data.service';
import { highlightText } from '../../utils/text-highlight.util';
import { formatDate, calculateAge } from '../../utils/date-formatter.util';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    TruncatePipe
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss']
})
export class UserTableComponent implements OnInit, OnDestroy {
  private readonly userDataService = inject(UserDataService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject$ = new Subject<string>();
  private readonly scrollSubject$ = new Subject<Event>();
  private loadUsersSubscription?: Subscription;

  users: User[] = [];
  filteredUsers: User[] = [];
  displayedUsers: User[] = [];
  loading = false;
  loadingMore = false;
  initialized = false;

  searchQuery = '';
  activeFilter: ActiveFilter = ActiveFilter.All;
  ageFilter: AgeFilter = AgeFilter.All;
  sortField: SortField | null = null;
  sortOrder: SortOrder | null = null;

  readonly pageSize = 50;
  private currentOffset = 0;
  private allLoadedUsers: User[] = [];
  public hasMoreData = true;

  readonly SortField = SortField;
  readonly SortOrder = SortOrder;
  readonly ActiveFilter = ActiveFilter;
  readonly AgeFilter = AgeFilter;

  ngOnInit(): void {
    this.initializeData();
    this.setupSearch();
    this.setupScroll();
  }

  ngOnDestroy(): void {
    if (this.loadUsersSubscription) {
      this.loadUsersSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject$.complete();
    this.scrollSubject$.complete();
  }

  private initializeData(): void {
    this.loading = true;
    this.userDataService.initializeData().pipe(
      switchMap(() => this.loadInitialData()),
      catchError((error: Error | DOMException) => {
        this.loading = false;
        this.initialized = true;
        return EMPTY;
      }),
      finalize(() => {
        this.loading = false;
        this.initialized = true;
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private loadInitialData(): Observable<void> {
    this.currentOffset = 0;
    this.allLoadedUsers = [];
    this.hasMoreData = true;
    this.loading = false;
    return this.loadMoreUsers();
  }

  private loadMoreUsers(): Observable<void> {
    if (!this.hasMoreData || this.loadingMore) {
      return EMPTY;
    }

    this.loadingMore = true;
    return this.userDataService.getUsers(this.currentOffset, this.pageSize).pipe(
      tap(newUsers => {
        if (newUsers.length === 0) {
          this.hasMoreData = false;
        } else {
          this.allLoadedUsers = [...this.allLoadedUsers, ...newUsers];
          this.currentOffset += newUsers.length;
          this.applyFiltersAndSort();
        }
      }),
      ignoreElements(),
      catchError((error: Error | DOMException) => {
        this.hasMoreData = false;
        return EMPTY;
      }),
      finalize(() => {
        this.loadingMore = false;
      })
    );
  }

  private setupSearch(): void {
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.applyFiltersAndSort();
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject$.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange('');
  }

  onActiveFilterChange(filter: ActiveFilter): void {
    this.activeFilter = filter;
    this.applyFiltersAndSort();
  }

  onAgeFilterChange(filter: AgeFilter): void {
    this.ageFilter = filter;
    this.applyFiltersAndSort();
  }

  onSort(field: SortField): void {
    if (this.sortField === field) {
      if (this.sortOrder === SortOrder.Asc) {
        this.sortOrder = SortOrder.Desc;
      } else if (this.sortOrder === SortOrder.Desc) {
        this.sortField = null;
        this.sortOrder = null;
      } else {
        this.sortOrder = SortOrder.Asc;
      }
    } else {
      this.sortField = field;
      this.sortOrder = SortOrder.Asc;
    }
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    let result = [...this.allLoadedUsers];

    result = this.applySearchFilter(result);
    result = this.applyActiveFilter(result);
    result = this.applyAgeFilter(result);
    result = this.applySort(result);

    this.filteredUsers = result;
    this.displayedUsers = result;
  }

  private applySearchFilter(users: User[]): User[] {
    if (!this.searchQuery.trim()) {
      return users;
    }

    const query = this.searchQuery.toLowerCase().trim();
    return users.filter(user => {
      return user.firstName.toLowerCase().includes(query) ||
             user.lastName.toLowerCase().includes(query) ||
             user.phoneNumber.includes(query) ||
             formatDate(user.dateOfBirth).toLowerCase().includes(query);
    });
  }

  private applyActiveFilter(users: User[]): User[] {
    if (this.activeFilter === ActiveFilter.All) {
      return users;
    }
    return users.filter(user => 
      this.activeFilter === ActiveFilter.Active ? user.active : !user.active
    );
  }

  private applyAgeFilter(users: User[]): User[] {
    if (this.ageFilter === AgeFilter.All) {
      return users;
    }
    return users.filter(user => {
      const age = calculateAge(user.dateOfBirth);
      return this.ageFilter === AgeFilter.Under18 ? age < 18 : age >= 18;
    });
  }

  private applySort(users: User[]): User[] {
    if (!this.sortField || !this.sortOrder) {
      return users;
    }

    return [...users].sort((a, b) => {
      let comparison = 0;

      switch (this.sortField) {
        case SortField.FirstName:
          comparison = a.firstName.localeCompare(b.firstName);
          break;
        case SortField.LastName:
          comparison = a.lastName.localeCompare(b.lastName);
          break;
        case SortField.DateOfBirth:
          comparison = a.dateOfBirth.getTime() - b.dateOfBirth.getTime();
          break;
      }

      return this.sortOrder === SortOrder.Asc ? comparison : -comparison;
    });
  }

  private setupScroll(): void {
    this.scrollSubject$.pipe(
      debounceTime(100),
      takeUntil(this.destroy$)
    ).subscribe(event => {
      const target = event.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      const scrollThreshold = 200;

      if (scrollHeight - scrollTop - clientHeight < scrollThreshold && this.hasMoreData && !this.loadingMore) {
        this.loadMoreUsersSafely();
      }
    });
  }

  onScroll(event: Event): void {
    this.scrollSubject$.next(event);
  }

  private loadMoreUsersSafely(): void {
    if (this.loadUsersSubscription && !this.loadUsersSubscription.closed) {
      return;
    }

    this.loadUsersSubscription = this.loadMoreUsers().pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  getHighlightedText(text: string): string {
    return highlightText(text, this.searchQuery);
  }

  getFormattedDate(date: Date): string {
    return formatDate(date);
  }

}

