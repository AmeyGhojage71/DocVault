import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';

import {
  MsalModule,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
  MsalInterceptor,
  MsalService,
  MsalBroadcastService
} from '@azure/msal-angular';

import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


// ================= MSAL INSTANCE =================
export function MSALInstanceFactory() {
  return new PublicClientApplication({
    auth: {
      clientId: '8ffa4b4d-3ec5-40f0-a18c-0f976bf80e21', // Angular App Registration
      authority: 'https://login.microsoftonline.com/4290a4f8-06d1-4535-ad77-859d562298ce',
      redirectUri: 'http://localhost:4200'
    }
  });
}


// ================= MSAL GUARD CONFIG =================
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [
        'user.read',
        'api://d9058600-ebf2-44c7-8137-06ffa19802a5/access_as_user'
      ]
    }
  };
}


// ================= MSAL INTERCEPTOR CONFIG =================
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {

  const protectedResourceMap = new Map<string, Array<string>>();

  protectedResourceMap.set(
  'http://localhost:5032/api/',
  ['api://d9058600-ebf2-44c7-8137-06ffa19802a5/access_as_user']
);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}


// ================= APP CONFIG =================
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideHttpClient(withInterceptorsFromDi()),

    importProvidersFrom(MsalModule),

    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },

    MsalService,
    MsalBroadcastService
  ]
};