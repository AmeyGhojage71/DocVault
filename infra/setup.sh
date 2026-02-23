#!/bin/bash
# DocVault — Azure Resource Provisioning Script
# Usage: bash infra/setup.sh
# Run after: az login

set -e

# ─── CONFIGURATION ────────────────────────────────────────
RESOURCE_GROUP="docvault-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="docvaultstorage$RANDOM"
COSMOS_ACCOUNT="docvault-cosmos-$RANDOM"
COSMOS_DB="docvault"
COSMOS_CONTAINER="documents"
KEYVAULT_NAME="docvault-kv-$RANDOM"
APPINSIGHTS_NAME="docvault-insights"
APPSERVICE_PLAN="docvault-plan"
API_APP_NAME="docvault-api-$RANDOM"
FUNCTIONS_APP_NAME="docvault-functions-$RANDOM"
EVENTGRID_TOPIC="docvault-events"
SERVICEBUS_NAMESPACE="docvault-bus-$RANDOM"
SERVICEBUS_QUEUE="document-processing"
ACR_NAME="docvaultacr$RANDOM"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DocVault Azure Resource Provisioning"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Resource Group
echo "[1/14] Creating Resource Group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
echo "  ✓ Resource Group: $RESOURCE_GROUP"

# 2. Storage Account
echo "[2/14] Creating Storage Account..."
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --allow-blob-public-access false \
  --output none

# Create containers
STORAGE_KEY=$(az storage account keys list \
  --account-name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" \
  --query "[0].value" -o tsv)

az storage container create --name "uploads" \
  --account-name "$STORAGE_ACCOUNT" --account-key "$STORAGE_KEY" --output none
az storage container create --name "thumbnails" \
  --account-name "$STORAGE_ACCOUNT" --account-key "$STORAGE_KEY" --output none
echo "  ✓ Storage Account: $STORAGE_ACCOUNT (containers: uploads, thumbnails)"

# 3. Blob Lifecycle Policy
echo "[3/14] Setting Blob Lifecycle Policy..."
az storage account management-policy create \
  --account-name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --policy @infra/lifecycle-policy.json \
  --output none
echo "  ✓ Lifecycle policy applied (Cool: 30d, Archive: 180d)"

# 4. Cosmos DB
echo "[4/14] Creating Cosmos DB..."
az cosmosdb create \
  --name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --locations regionName="$LOCATION" failoverPriority=0 isZoneRedundant=false \
  --default-consistency-level "Session" \
  --output none

az cosmosdb sql database create \
  --account-name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --name "$COSMOS_DB" \
  --output none

az cosmosdb sql container create \
  --account-name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --database-name "$COSMOS_DB" \
  --name "$COSMOS_CONTAINER" \
  --partition-key-path "/userId" \
  --throughput 400 \
  --output none
echo "  ✓ Cosmos DB: $COSMOS_ACCOUNT / $COSMOS_DB / $COSMOS_CONTAINER"

# 5. Application Insights
echo "[5/14] Creating Application Insights..."
az monitor app-insights component create \
  --app "$APPINSIGHTS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --application-type "web" \
  --output none
echo "  ✓ Application Insights: $APPINSIGHTS_NAME"

# 6. App Service Plan
echo "[6/14] Creating App Service Plan..."
az appservice plan create \
  --name "$APPSERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku B1 \
  --is-linux \
  --output none
echo "  ✓ App Service Plan: $APPSERVICE_PLAN"

# 7. App Service (API)
echo "[7/14] Creating App Service (API)..."
INSIGHTS_KEY=$(az monitor app-insights component show \
  --app "$APPINSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" \
  --query "instrumentationKey" -o tsv)

az webapp create \
  --name "$API_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APPSERVICE_PLAN" \
  --runtime "DOTNETCORE:8.0" \
  --output none

# Enable Managed Identity on App Service
az webapp identity assign \
  --name "$API_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none
echo "  ✓ App Service: $API_APP_NAME (Managed Identity enabled)"

# 8. Azure Functions
echo "[8/14] Creating Function App..."
az functionapp create \
  --name "$FUNCTIONS_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --storage-account "$STORAGE_ACCOUNT" \
  --consumption-plan-location "$LOCATION" \
  --runtime dotnet-isolated \
  --functions-version 4 \
  --output none

az functionapp identity assign \
  --name "$FUNCTIONS_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none
echo "  ✓ Function App: $FUNCTIONS_APP_NAME (Managed Identity enabled)"

# 9. Key Vault
echo "[9/14] Creating Key Vault..."
az keyvault create \
  --name "$KEYVAULT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --enable-rbac-authorization false \
  --output none

# Get Managed Identity principal IDs
API_PRINCIPAL_ID=$(az webapp identity show \
  --name "$API_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --query "principalId" -o tsv)

FUNC_PRINCIPAL_ID=$(az functionapp identity show \
  --name "$FUNCTIONS_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --query "principalId" -o tsv)

# Grant Key Vault access
az keyvault set-policy --name "$KEYVAULT_NAME" \
  --object-id "$API_PRINCIPAL_ID" \
  --secret-permissions get list --output none
az keyvault set-policy --name "$KEYVAULT_NAME" \
  --object-id "$FUNC_PRINCIPAL_ID" \
  --secret-permissions get list --output none

# Store secrets in Key Vault
COSMOS_ENDPOINT=$(az cosmosdb show \
  --name "$COSMOS_ACCOUNT" --resource-group "$RESOURCE_GROUP" \
  --query "documentEndpoint" -o tsv)
COSMOS_KEY=$(az cosmosdb keys list \
  --name "$COSMOS_ACCOUNT" --resource-group "$RESOURCE_GROUP" \
  --query "primaryMasterKey" -o tsv)
STORAGE_CONN=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" \
  --query "connectionString" -o tsv)
INSIGHTS_CONN=$(az monitor app-insights component show \
  --app "$APPINSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" \
  --query "connectionString" -o tsv)

az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "CosmosEndpoint" --value "$COSMOS_ENDPOINT" --output none
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "CosmosKey" --value "$COSMOS_KEY" --output none
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "StorageConnectionString" --value "$STORAGE_CONN" --output none
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "AppInsightsConnection" --value "$INSIGHTS_CONN" --output none
echo "  ✓ Key Vault: $KEYVAULT_NAME (secrets stored, Managed Identity access granted)"

# 10. Event Grid Topic
echo "[10/14] Creating Event Grid Topic..."
az eventgrid topic create \
  --name "$EVENTGRID_TOPIC" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

EVENTGRID_ENDPOINT=$(az eventgrid topic show \
  --name "$EVENTGRID_TOPIC" --resource-group "$RESOURCE_GROUP" \
  --query "endpoint" -o tsv)
EVENTGRID_KEY=$(az eventgrid topic key list \
  --name "$EVENTGRID_TOPIC" --resource-group "$RESOURCE_GROUP" \
  --query "key1" -o tsv)

az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "EventGridEndpoint" --value "$EVENTGRID_ENDPOINT" --output none
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "EventGridKey" --value "$EVENTGRID_KEY" --output none
echo "  ✓ Event Grid Topic: $EVENTGRID_TOPIC"

# 11. Service Bus
echo "[11/14] Creating Service Bus..."
az servicebus namespace create \
  --name "$SERVICEBUS_NAMESPACE" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard \
  --output none

az servicebus queue create \
  --name "$SERVICEBUS_QUEUE" \
  --namespace-name "$SERVICEBUS_NAMESPACE" \
  --resource-group "$RESOURCE_GROUP" \
  --max-delivery-count 3 \
  --output none

SB_CONN=$(az servicebus namespace authorization-rule keys list \
  --name RootManageSharedAccessKey \
  --namespace-name "$SERVICEBUS_NAMESPACE" \
  --resource-group "$RESOURCE_GROUP" \
  --query "primaryConnectionString" -o tsv)
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "ServiceBusConnection" --value "$SB_CONN" --output none
echo "  ✓ Service Bus: $SERVICEBUS_NAMESPACE / $SERVICEBUS_QUEUE"

# 12. Container Registry
echo "[12/14] Creating Container Registry..."
az acr create \
  --name "$ACR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --sku Basic \
  --admin-enabled true \
  --output none
echo "  ✓ Container Registry: $ACR_NAME"

# 13. Wire App Service environment variables (no secrets — Key Vault refs)
echo "[13/14] Configuring App Service settings..."
KV_URI="https://${KEYVAULT_NAME}.vault.azure.net"
az webapp config appsettings set \
  --name "$API_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    "KeyVaultUri=$KV_URI" \
    "APPLICATIONINSIGHTS_CONNECTION_STRING=@Microsoft.KeyVault(VaultName=${KEYVAULT_NAME};SecretName=AppInsightsConnection)" \
    "CosmosDb__Endpoint=@Microsoft.KeyVault(VaultName=${KEYVAULT_NAME};SecretName=CosmosEndpoint)" \
    "CosmosDb__Key=@Microsoft.KeyVault(VaultName=${KEYVAULT_NAME};SecretName=CosmosKey)" \
    "CosmosDb__DatabaseName=docvault" \
    "CosmosDb__ContainerName=documents" \
    "BlobStorage__ConnectionString=@Microsoft.KeyVault(VaultName=${KEYVAULT_NAME};SecretName=StorageConnectionString)" \
    "BlobStorage__ContainerName=uploads" \
    "BlobStorage__ThumbnailContainer=thumbnails" \
    "EventGrid__TopicEndpoint=@Microsoft.KeyVault(VaultName=${KEYVAULT_NAME};SecretName=EventGridEndpoint)" \
    "EventGrid__TopicKey=@Microsoft.KeyVault(VaultName=${KEYVAULT_NAME};SecretName=EventGridKey)" \
    "ServiceBus__ConnectionString=@Microsoft.KeyVault(VaultName=${KEYVAULT_NAME};SecretName=ServiceBusConnection)" \
    "ServiceBus__QueueName=document-processing" \
  --output none
echo "  ✓ App Service environment variables configured (Key Vault references)"

# 14. App Insights Availability Test
echo "[14/14] Creating Availability Test..."
HEALTH_URL="https://${API_APP_NAME}.azurewebsites.net/api/health"
echo "  → Health endpoint: $HEALTH_URL"
echo "  ! Create availability test manually in Azure Portal:"
echo "    App Insights → Availability → + Create → Standard test"
echo "    URL: $HEALTH_URL | Frequency: 5 min | Locations: 3 regions"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Provisioning Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  API URL:       https://${API_APP_NAME}.azurewebsites.net"
echo "  Key Vault URI: $KV_URI"
echo "  Cosmos:        $COSMOS_ACCOUNT"
echo "  Storage:       $STORAGE_ACCOUNT"
echo "  Functions:     $FUNCTIONS_APP_NAME"
echo "  EventGrid:     $EVENTGRID_TOPIC"
echo "  Service Bus:   $SERVICEBUS_NAMESPACE"
echo "  ACR:           $ACR_NAME"
echo ""
echo "  ⚠  Next steps:"
echo "  1. Register app in Entra ID (App Registration)"
echo "  2. Update appsettings.json with EntraId values"
echo "  3. Configure APIM (import API from $HEALTH_URL)"
echo "  4. Add GitHub Secrets: AZURE_WEBAPP_PUBLISH_PROFILE, AZURE_FUNCTIONS_PUBLISH_PROFILE"
