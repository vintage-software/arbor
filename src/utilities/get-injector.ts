import { Type } from '@angular/core';
import { platformDynamicServer  } from '@angular/platform-server';

export async function getInjector<M>(moduleType: Type<M>) {
  const appRef = await platformDynamicServer().bootstrapModule(moduleType);
  return appRef.injector;
}
