import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);

    // Only add auth header to API calls
    const isApiCall = req.url.startsWith(environment.apiUrl) ||
        req.url.startsWith(environment.apimUrl);

    if (!isApiCall || !authService.isAuthenticated) {
        return next(req);
    }

    return from(authService.getAccessToken()).pipe(
        switchMap(token => {
            const authReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            });
            return next(authReq);
        })
    );
};
