import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';
import { UnauthorizedException } from '@nestjs/common';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

describe('AuthService', () => {
  let service: AuthService;
  let apiKeyRepository: jest.Mocked<Repository<ApiKey>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockApiKeyRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: mockApiKeyRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    apiKeyRepository = module.get(getRepositoryToken(ApiKey));
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
  });

  it('should validate a valid active API key', async () => {
    const mockApiKey = { id: '1', key: 'valid-key', isActive: true } as ApiKey;
    apiKeyRepository.findOne.mockResolvedValue(mockApiKey);

    const result = await service.validateApiKey('valid-key');

    expect(result).toBe(mockApiKey);
    expect(apiKeyRepository.findOne).toHaveBeenCalledWith({
      where: { key: 'valid-key', isActive: true },
    });
  });

  it('should throw UnauthorizedException when API key is not found', async () => {
    apiKeyRepository.findOne.mockResolvedValue(null);

    await expect(service.validateApiKey('invalid-key')).rejects.toThrow(
      new UnauthorizedException('Clé API invalide ou expirée'),
    );
  });

  it('should throw UnauthorizedException when API key is expired', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const mockApiKey = {
      id: '1',
      key: 'expired-key',
      isActive: true,
      expiresAt: yesterday,
    } as ApiKey;

    apiKeyRepository.findOne.mockResolvedValue(mockApiKey);

    await expect(service.validateApiKey('expired-key')).rejects.toThrow(
      new UnauthorizedException('Clé API invalide ou expirée'),
    );
  });

  it('should create a new API key', async () => {
    const createApiKeyDto: CreateApiKeyDto = {
      name: 'Test API Key',
      isActive: true,
    };

    const generatedKey = 'generated-api-key';
    jest.spyOn(service as any, 'generateApiKey').mockReturnValue(generatedKey);

    const createdApiKey = { ...createApiKeyDto, key: generatedKey } as ApiKey;
    apiKeyRepository.create.mockReturnValue(createdApiKey);
    apiKeyRepository.save.mockResolvedValue(createdApiKey);

    const result = await service.createApiKey(createApiKeyDto);

    expect(result).toBe(createdApiKey);
    expect(apiKeyRepository.create).toHaveBeenCalledWith({
      ...createApiKeyDto,
      key: generatedKey,
    });
    expect(apiKeyRepository.save).toHaveBeenCalledWith(createdApiKey);
  });

  it('should return all API keys', async () => {
    const mockApiKeys = [
      { id: '1', key: 'key-1', isActive: true },
      { id: '2', key: 'key-2', isActive: false },
    ] as ApiKey[];

    apiKeyRepository.find.mockResolvedValue(mockApiKeys);

    const result = await service.getAllApiKeys();

    expect(result).toEqual(mockApiKeys);
    expect(apiKeyRepository.find).toHaveBeenCalled();
  });

  it('should revoke an API key by setting isActive to false', async () => {
    const apiKeyId = 'key-to-revoke';

    await service.revokeApiKey(apiKeyId);

    expect(apiKeyRepository.update).toHaveBeenCalledWith(apiKeyId, {
      isActive: false,
    });
  });
});
