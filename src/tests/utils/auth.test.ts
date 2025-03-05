import { getKey } from "../../utils/auth";
import jwksClient, { JwksClient, SigningKey } from "jwks-rsa";

jest.mock("jwks-rsa", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    getSigningKey: jest.fn(),
  }),
}));

describe("getKey function", () => {
  let mockGetSigningKey;

  beforeEach(() => {
    mockGetSigningKey = jwksClient({
      jwksUri: `https://auth0domain/.well-known/jwks.json`,
    }).getSigningKey;
  }) as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve with the signing key when getSigningKey is successful", async () => {
    // Prepare mock data
    const mockHeader = { kid: "mockKid" };
    const mockSigningKey = {
      getPublicKey: jest.fn().mockReturnValue("mockPublicKey"),
    };

    // Simulate success in `getSigningKey` call
    mockGetSigningKey.mockImplementation((kid: string, callback: any) => {
      callback(null, mockSigningKey);
    });

    // Call the getKey function
    const result = await getKey(mockHeader);

    // Assertions
    expect(result).toBe("mockPublicKey");
    expect(mockGetSigningKey).toHaveBeenCalledWith(
      "mockKid",
      expect.any(Function),
    );
  });

  it("should reject with an error if getSigningKey fails", async () => {
    // Prepare mock data
    const mockHeader = { kid: "mockKid" };
    const mockError = new Error("Failed to get signing key");

    // Simulate failure in `getSigningKey` call
    mockGetSigningKey.mockImplementation(
      (kid: string, callback: (err: any, key?: SigningKey) => void) => {
        callback(mockError, null);
      },
    );

    // Call the getKey function and assert that it rejects
    await expect(getKey(mockHeader)).rejects.toThrowError(mockError);
    expect(mockGetSigningKey).toHaveBeenCalledWith(
      "mockKid",
      expect.any(Function),
    );
  });

  it("should resolve with an empty string if no public key is found", async () => {
    // Prepare mock data
    const mockHeader = { kid: "mockKid" };

    // Simulate a case where `getPublicKey` is empty
    const mockSigningKey = { getPublicKey: jest.fn().mockReturnValue("") };

    mockGetSigningKey.mockImplementation(
      (kid: string, callback: (err: any, key?: SigningKey) => void) => {
        callback(null, mockSigningKey as unknown as SigningKey);
      },
    );

    // Call the getKey function
    const result = await getKey(mockHeader);

    // Assertions
    expect(result).toBe("");
    expect(mockGetSigningKey).toHaveBeenCalledWith(
      "mockKid",
      expect.any(Function),
    );
  });
});
