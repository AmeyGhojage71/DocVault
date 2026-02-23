import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const broadcastService = inject(MsalBroadcastService);

    // Wait for MSAL to finish any in-progress interaction (e.g. redirect callback)
    // before deciding if the user is authenticated.
    return broadcastService.inProgress$.pipe(
        filter(status => status === InteractionStatus.None),
        take(1),
        map(() => {
            if (authService.isAuthenticated) {
                return true;
            }
            return router.createUrlTree(['/login']);
        })
    );
};
