export const environment = {
    production: false,
    apiUrl: 'http://localhost:5000',
    apimUrl: 'http://localhost:5000',
    msalConfig: {
        auth: {
            clientId: '8ffa4b4d-3ec5-40f0-a18c-0f976bf80e21',  // API's app registration (also used as SPA)
            authority: 'https://login.microsoftonline.com/4290a4f8-06d1-4535-ad77-859d562298ce',
            redirectUri: 'http://localhost:4200',
            postLogoutRedirectUri: 'http://localhost:4200'
        }
    },
    apiScope: 'api://d9058600-ebf2-44c7-8137-06ffa19802a5/.default'
};
