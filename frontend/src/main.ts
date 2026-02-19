import { routes } from './app/app.routes';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { importProvidersFrom } from '@angular/core';
import { MsalModule, MsalGuard } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';


bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
