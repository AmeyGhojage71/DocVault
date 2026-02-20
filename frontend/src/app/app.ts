import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {

  private readonly _destroying$ = new Subject<void>();

  constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

ngOnInit(): void {

  this.msalBroadcastService.inProgress$
    .pipe(
      filter((status: InteractionStatus) => status === InteractionStatus.None)
    )
    .subscribe(() => {

      const accounts = this.msalService.instance.getAllAccounts();

      if (accounts.length > 0) {
        this.msalService.instance.setActiveAccount(accounts[0]);
        console.log("✅ Active account set:", accounts[0]);
      } else {
        console.log("❌ No accounts found");
      }

    });
}
  ngOnDestroy(): void {
    this._destroying$.next();
    this._destroying$.complete();
  }
}