import jwksClient, { JwksClient, SigningKey } from "jwks-rsa";

const client: JwksClient = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

const getKey = async (header: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.getSigningKey(header.kid, (err, key?: SigningKey) => {
      if (err) {
        reject(err);
      } else {
        const signingKey = key?.getPublicKey() ?? "";
        resolve(signingKey);
      }
    });
  });
};

export { getKey };
