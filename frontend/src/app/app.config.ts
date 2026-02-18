import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';

import { MsalModule, MsalGuard } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideClientHydration(withEventReplay()),

    provideHttpClient(withFetch()),   // ✅ COMMA ADDED HERE

    importProvidersFrom(
      MsalModule.forRoot(
        new PublicClientApplication({
          auth: {
            clientId: '8ffa4b4d-3ec5-40f0-a18c-0f976bf80e21', // Replace
            authority: 'https://login.microsoftonline.com/4290a4f8-06d1-4535-ad77-859d562298ce',
            redirectUri: 'http://localhost:4200'
          }
        }),
        {
          interactionType: InteractionType.Redirect,
          authRequest: {
            scopes: ['user.read']
          }
        },
        {
          interactionType: InteractionType.Redirect,
          protectedResourceMap: new Map()
        }
      )
    ),

    MsalGuard
  ]
};

