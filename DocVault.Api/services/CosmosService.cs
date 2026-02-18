using Microsoft.Azure.Cosmos;

namespace DocVault.api.Services;

public class CosmosService
{
    private readonly Container _container;

    public CosmosService(CosmosClient client, IConfiguration config)
    {
        _container = client.GetContainer(
            config["Cosmos:Database"],
            config["Cosmos:Container"]
        );
    }
}
