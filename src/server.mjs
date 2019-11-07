const Provider = require("oidc-provider");

  
export async function server(config) {
  const configuration = {
    async findAccount(ctx, id) {
      return {
        accountId: id,
        async claims(use, scope) { return { sub: id }; },
      };
    },

    features: {
      introspection: { enabled: true },
      revocation: { enabled: true },
    },
    formats: {
      AccessToken: 'jwt',
    },
    clients: [{
      client_id: 'foo',
      client_secret: 'bar',
      redirect_uris: ['http://lvh.me:8080/cb']
    }],
  };

  const provider = new Provider('https://mfelten.dynv6.net/services/entitlement-provider', configuration);
  

  console.log(provider.app);
  //app.use(provider.app);
}
