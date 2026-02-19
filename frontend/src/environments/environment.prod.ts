export const environment = {
  production: true,
  azureAd: {
    clientId: "8ffa4b4d-3ec5-40f0-a18c-0f976bf80e21",
    authority: "https://login.microsoftonline.com/4290a4f8-06d1-4535-ad77-859d562298ce",
    redirectUri: "https://your-production-url",
      apiBaseUrl: 'https://your-backend-app.azurewebsites.net/api'

  },
  api: {
    scope: "api://d9058600-ebf2-44c7-8137-06ffa19802a5/access_as_user",
    baseUrl: "https://your-production-api-url/api"
  }

};
