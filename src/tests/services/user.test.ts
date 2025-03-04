import { AuthenticationClient } from "auth0";
import { userServices } from "../../services/user"; // Adjust path accordingly

jest.mock("auth0", () => {
  return {
    AuthenticationClient: jest.fn().mockImplementation(() => ({
      database: {
        signUp: jest.fn(),
      },
      oauth: {
        passwordGrant: jest.fn(),
      },
    })),
  };
});

const mockAuthClient = {
  database: {
    signUp: jest.fn(),
  },
  oauth: {
    passwordGrant: jest.fn(),
  },
} as unknown as AuthenticationClient;

describe("userServices", () => {
  let authClient;
  let service;
  let payloadReq;

  beforeEach(() => {
    payloadReq = {
      email: "test@example.com",
      password: "password123",
      name: "John Doe",
    };
    authClient = mockAuthClient;
    service = userServices({ payloadReq, authClient });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("registerNewUser should call authClient.database.signUp with correct parameters", async () => {
    authClient.database.signUp.mockResolvedValue({ success: true });

    const response = await service.registerNewUser();

    expect(authClient.database.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      connection: "Username-Password-Authentication",
      user_metadata: { firstName: "John Doe" },
    });
    expect(response).toEqual({ success: true });
  });

  test("getAccessToken should call authClient.oauth.passwordGrant and return id_token", async () => {
    process.env.AUTH0_CLIENT_ID = "test-client-id";
    process.env.AUTH0_CLIENT_SECRET = "test-client-secret";
    process.env.AUTH0_DOMAIN = "test.auth0.com";

    authClient.oauth.passwordGrant.mockResolvedValue({
      data: { id_token: "mocked-id-token" },
    });

    const token = await service.getAccessToken();

    expect(authClient.oauth.passwordGrant).toHaveBeenCalledWith({
      username: "test@example.com",
      password: "password123",
      realm: "Username-Password-Authentication",
      client_id: "test-client-id",
      client_secret: "test-client-secret",
      scope: "openid profile email",
      audience: "https://test.auth0.com/api/v2/",
    });
    expect(token).toBe("mocked-id-token");
  });

  test("getAccessToken should return undefined if id_token is missing", async () => {
    authClient.oauth.passwordGrant.mockResolvedValue({ data: {} });

    const token = await service.getAccessToken();

    expect(token).toBeUndefined();
  });
});
