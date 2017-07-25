import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appEnumValue'
})
export class EnumValuePipe implements PipeTransform {
  transform(value: string) {
    return value.replace(/([A-Z])/g, ' $1').trim();
  }
}
