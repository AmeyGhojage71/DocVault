import { Injectable } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { AccountInfo, InteractionStatus, EventMessage, EventType } from '@azure/msal-browser';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private _isAuthenticated = new BehaviorSubject<boolean>(false);
    private _currentUser = new BehaviorSubject<AccountInfo | null>(null);

    isAuthenticated$ = this._isAuthenticated.asObservable();
    currentUser$ = this._currentUser.asObservable();

    constructor(
        private msalService: MsalService,
        private broadcastService: MsalBroadcastService
    ) {
        // Wait until MSAL has finished handling the redirect before checking accounts.
        this.broadcastService.inProgress$
            .pipe(filter(status => status === InteractionStatus.None))
            .subscribe(() => this.checkAuth());

        // Also react to login/logout events
        this.broadcastService.msalSubject$
            .pipe(filter((msg: EventMessage) =>
                msg.eventType === EventType.LOGIN_SUCCESS ||
                msg.eventType === EventType.LOGOUT_SUCCESS
            ))
            .subscribe(() => this.checkAuth());
    }

    private checkAuth(): void {
        const accounts = this.msalService.instance.getAllAccounts();
        if (accounts.length > 0) {
            this._isAuthenticated.next(true);
            this._currentUser.next(accounts[0]);
        } else {
            this._isAuthenticated.next(false);
            this._currentUser.next(null);
        }
    }

    get isAuthenticated(): boolean {
        return this._isAuthenticated.value;
    }

    get currentUser(): AccountInfo | null {
        return this._currentUser.value;
    }

    get userDisplayName(): string {
        const user = this._currentUser.value;
        return user?.name ?? user?.username ?? 'User';
    }

    get userInitials(): string {
        const name = this.userDisplayName;
        const parts = name.split(' ');
        return parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    }

    login(): Observable<void> {
        return from(
            this.msalService.instance.loginPopup({
                scopes: [environment.apiScope]
            })
        ).pipe(
            tap((result) => {
                this._isAuthenticated.next(true);
                this._currentUser.next(result.account);
            }),
            tap(() => { })
        ) as unknown as Observable<void>;
    }

    logout(): Observable<void> {
        return from(
            this.msalService.instance.logoutPopup()
        ).pipe(
            tap(() => {
                this._isAuthenticated.next(false);
                this._currentUser.next(null);
            })
        ) as unknown as Observable<void>;
    }

    getAccessToken(): Observable<string> {
        const account = this.currentUser;
        return from(
            this.msalService.instance.acquireTokenSilent({
                scopes: [environment.apiScope],
                account: account ?? undefined
            }).then(result => result.accessToken)
        );
    }
}
