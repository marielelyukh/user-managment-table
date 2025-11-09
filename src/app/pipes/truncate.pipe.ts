import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 20, trail: string = '...'): string {
    if (!value) {
      return '';
    }
    
    if (value.includes('<')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = value;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      if (plainText.length <= limit) {
        return value;
      }
      
      const truncatedText = plainText.substring(0, limit) + trail;
      return value.replace(plainText, truncatedText);
    }
    
    if (value.length <= limit) {
      return value;
    }
    
    return value.substring(0, limit) + trail;
  }
}

