import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";

// Services
import { userService } from "../../services/userService.ts";

// Entities
import { User } from "../../entities/user.ts";

// Types
import { UserRole } from "../../types/user.ts";

// Mocks
import { USER } from "../../__mocks__/user.ts";

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

describe("userService", () => {
  let mockRepository: Repository<User>;
  let service: ReturnType<typeof userService>;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<User>;

    service = userService(mockRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return a user that match the criteria", async () => {
    (mockRepository.findOneBy as jest.Mock).mockResolvedValue(USER);

    const result = await service.findUser({ id: "1" });

    expect(result).toEqual(USER);
    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: "1" });
  });

  it("should return all users", async () => {
    (mockRepository.find as jest.Mock).mockResolvedValue([USER]);

    const result = await service.getAllUsers();

    expect(result).toEqual([USER]);
    expect(mockRepository.find).toHaveBeenCalledWith();
  });

  it("should create a new user", async () => {
    const hashedPassword = "hashedPassword";
    const mockUserPayload = {
      name: "User test",
      email: "usertest@example.com",
      password: hashedPassword,
      role: UserRole.Admin,
    };
    const mockResult = {
      id: "1",
      name: "John Doe",
      role: UserRole.Admin,
      email: "B4s8s@example.com",
      dish: [],
      carts: [],
      orders: [],
      createdAt: "2025-03-07T08:25:55.043Z",
      updatedAt: "2025-03-07T08:25:55.043Z",
    };

    (mockRepository.create as jest.Mock).mockReturnValue(USER);
    (mockRepository.save as jest.Mock).mockResolvedValue(USER);

    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

    const result = await service.createUser(mockUserPayload);

    expect(result).toEqual(mockResult);
    expect(mockRepository.create).toHaveBeenCalledWith(mockUserPayload);
    expect(mockRepository.save).toHaveBeenCalledWith(USER);
    expect(bcrypt.hash).toHaveBeenCalledWith("hashedPassword", 10);
  });
});
