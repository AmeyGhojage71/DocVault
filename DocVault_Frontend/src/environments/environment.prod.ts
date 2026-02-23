export const environment = {
    production: true,
    // These values are injected from Azure Static Web Apps environment config
    apiUrl: 'https://YOUR_APP_SERVICE.azurewebsites.net',
    apimUrl: 'https://YOUR_APIM_GATEWAY.azure-api.net/docvault',
    msalConfig: {
        auth: {
            clientId: 'YOUR_ANGULAR_APP_CLIENT_ID',
            authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
            redirectUri: 'https://YOUR_STATIC_WEB_APP.azurestaticapps.net',
            postLogoutRedirectUri: 'https://YOUR_STATIC_WEB_APP.azurestaticapps.net'
        }
    },
    apiScope: 'api://YOUR_API_CLIENT_ID/access_as_user'
};
