import { AuthenticationClient } from "auth0";

export const auth0Service = ({
  payloadReq,
  authClient,
}: {
  payloadReq: {
    email: string;
    password: string;
    name: string;
  };
  authClient: AuthenticationClient;
}) => {
  return {
    registerNewUser: async () => {
      const { name, email, password } = payloadReq;

      return await authClient.database.signUp({
        email,
        password,
        connection: "Username-Password-Authentication", // Default Auth0 connection for username-password
        user_metadata: { firstName: name },
      });
    },

    getAccessToken: async () => {
      const { email, password } = payloadReq;

      const tokenResponse = await authClient.oauth.passwordGrant({
        username: email,
        password,
        realm: "Username-Password-Authentication",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        scope: "openid profile email", // Define the scope of the access request
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`, // Define your API audience
      });

      const { id_token } = tokenResponse?.data ?? {};

      return id_token;
    },
  };
};
