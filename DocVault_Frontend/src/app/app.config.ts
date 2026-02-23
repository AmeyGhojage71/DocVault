import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
    MSAL_INSTANCE,
    MSAL_GUARD_CONFIG,
    MSAL_INTERCEPTOR_CONFIG,
    MsalService,
    MsalGuard,
    MsalBroadcastService
} from '@azure/msal-angular';
import {
    PublicClientApplication,
    LogLevel,
    InteractionType,
    BrowserCacheLocation
} from '@azure/msal-browser';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { environment } from '../environments/environment';

export function MSALInstanceFactory(): PublicClientApplication {
    return new PublicClientApplication({
        auth: {
            clientId: environment.msalConfig.auth.clientId,
            authority: environment.msalConfig.auth.authority,
            redirectUri: environment.msalConfig.auth.redirectUri,
            postLogoutRedirectUri: environment.msalConfig.auth.postLogoutRedirectUri
        },
        cache: {
            cacheLocation: BrowserCacheLocation.SessionStorage,
            storeAuthStateInCookie: false
        },
        system: {
            loggerOptions: {
                logLevel: environment.production ? LogLevel.Error : LogLevel.Warning,
                piiLoggingEnabled: false
            }
        }
    });
}

export function MSALInitializer(msal: MsalService) {
    return () => msal.instance.initialize();
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withViewTransitions()),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideAnimations(),
        {
            provide: MSAL_INSTANCE,
            useFactory: MSALInstanceFactory
        },
        {
            provide: MSAL_GUARD_CONFIG,
            useValue: {
                interactionType: InteractionType.Redirect,
                authRequest: { scopes: [environment.apiScope] }
            }
        },
        {
            provide: MSAL_INTERCEPTOR_CONFIG,
            useValue: {
                interactionType: InteractionType.Redirect,
                protectedResourceMap: new Map([
                    [environment.apiUrl + '/api/', [environment.apiScope]]
                ])
            }
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService,
        {
            provide: APP_INITIALIZER,
            useFactory: MSALInitializer,
            deps: [MsalService],
            multi: true
        }
    ]
};
