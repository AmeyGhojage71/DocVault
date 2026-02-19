# DocVault - Daywise Implementation Plan

## DAY 1 - Foundation & Storage

### Security Fixes
- [ ] 1. Fix .gitignore to exclude appsettings.json
- [ ] 2. Update appsettings.json to use environment variables

### GitHub & CI/CD
- [ ] 3. Create GitHub Actions CI workflow (ci.yml)
- [ ] 4. Create GitHub Actions deploy workflow (deploy.yml)

### Backend Enhancements
- [ ] 5. Update Document model with full schema (id, userId, fileName, blobUrl, contentType, sizeBytes, uploadedAt, tags, excerpt, thumbnailUrl, status)
- [ ] 6. Enhance Upload API: Add proper metadata, SAS token generation
- [ ] 7. Enhance List API: Add user filtering, SAS download URLs
- [ ] 8. Add Get by ID endpoint
- [ ] 9. Add Delete endpoint
- [ ] 10. Add Health check endpoint

### Frontend Enhancements
- [ ] 11. Add upload method to DocumentService
- [ ] 12. Update DocumentService interface with full schema
- [ ] 13. Connect DocumentList component to API
- [ ] 14. Add download functionality

### Azure Configuration
- [ ] 15. Set up Blob lifecycle policy (Cool after 30 days, Archive after 180 days)

## DAY 2 - Security, Identity & Serverless

### Key Vault & Managed Identity
- [ ] 16. Create Key Vault setup script
- [ ] 17. Move secrets to Key Vault
- [ ] 18. Enable Managed Identity on App Service

### Authentication
- [ ] 19. Add JWT bearer authentication middleware in .NET API
- [ ] 20. Update Angular auth guard
- [ ] 21. Protect API endpoints

### Azure Functions
- [ ] 22. Create Azure Function project
- [ ] 23. Implement Blob trigger function for thumbnail generation
- [ ] 24. Implement text extraction
- [ ] 25. Enable Managed Identity on Function App

### Search
- [ ] 26. Add search endpoint in API
- [ ] 27. Add search UI in frontend
