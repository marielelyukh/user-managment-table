import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { 
  SearchOutline, 
  SortAscendingOutline, 
  SortDescendingOutline, 
  UnorderedListOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  CloseCircleOutline
} from '@ant-design/icons-angular/icons';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    provideNzI18n(en_US),
    provideNzIcons([
      SearchOutline, 
      SortAscendingOutline, 
      SortDescendingOutline, 
      UnorderedListOutline,
      ArrowUpOutline,
      ArrowDownOutline,
      CloseCircleOutline
    ])
  ]
}).catch(err => console.error(err));


