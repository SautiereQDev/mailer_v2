import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKey } from './entities/api-key.entity';

describe('ApiKeyController', () => {
  let controller: ApiKeyController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      createApiKey: jest.fn(),
      getAllApiKeys: jest.fn(),
      revokeApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeyController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<ApiKeyController>(ApiKeyController);
    authService = module.get(AuthService);
  });

  it('should create a new API key', async () => {
    const createApiKeyDto: CreateApiKeyDto = {
      name: 'Test API Key',
      isActive: true,
    };
    const expectedApiKey = {
      id: '1',
      ...createApiKeyDto,
      key: 'generated-key',
    } as ApiKey;

    authService.createApiKey.mockResolvedValue(expectedApiKey);

    const result = await controller.create(createApiKeyDto);

    expect(authService.createApiKey).toHaveBeenCalledWith(createApiKeyDto);
    expect(result).toEqual(expectedApiKey);
  });

  it('should return all API keys', async () => {
    const expectedApiKeys = [
      { id: '1', name: 'API Key 1', isActive: true, key: 'key-1' },
      { id: '2', name: 'API Key 2', isActive: false, key: 'key-2' },
    ] as ApiKey[];

    authService.getAllApiKeys.mockResolvedValue(expectedApiKeys);

    const result = await controller.findAll();

    expect(authService.getAllApiKeys).toHaveBeenCalled();
    expect(result).toEqual(expectedApiKeys);
  });

  it('should revoke an API key', async () => {
    const apiKeyId = 'key-to-revoke';
    authService.revokeApiKey.mockResolvedValue(undefined);

    await controller.revoke(apiKeyId);

    expect(authService.revokeApiKey).toHaveBeenCalledWith(apiKeyId);
  });

  it('should pass through service errors when creating API key', async () => {
    const createApiKeyDto: CreateApiKeyDto = {
      name: 'Test API Key',
      isActive: true,
    };
    const error = new Error('Creation failed');

    authService.createApiKey.mockRejectedValue(error);

    await expect(controller.create(createApiKeyDto)).rejects.toThrow(error);
  });

  it('should pass through service errors when getting all API keys', async () => {
    const error = new Error('Database error');

    authService.getAllApiKeys.mockRejectedValue(error);

    await expect(controller.findAll()).rejects.toThrow(error);
  });

  it('should pass through service errors when revoking API key', async () => {
    const apiKeyId = 'non-existent-key';
    const error = new Error('Key not found');

    authService.revokeApiKey.mockRejectedValue(error);

    await expect(controller.revoke(apiKeyId)).rejects.toThrow(error);
  });
});
