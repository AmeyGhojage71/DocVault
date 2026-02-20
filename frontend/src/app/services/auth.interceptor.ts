import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MsalService } from '@azure/msal-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private msalService: MsalService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const account = this.msalService.instance.getActiveAccount();

    if (!account) {
      return next.handle(req);
    }

    return from(
      this.msalService.instance.acquireTokenSilent({
        scopes: ['api://d9058600-ebf2-44c7-8137-06ffa19802a5/access_as_user'], // ⚠ Replace properly
        account: account
      })
    ).pipe(
      switchMap((result) => {

        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${result.accessToken}`
          }
        });

        return next.handle(authReq);
      })
    );
  }
}