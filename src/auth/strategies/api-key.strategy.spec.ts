import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyStrategy } from './api-key.strategy';
import { AuthService } from '../services/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKey } from '../entities/api-key.entity';

describe('ApiKeyStrategy', () => {
  let strategy: ApiKeyStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      validateApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<ApiKeyStrategy>(ApiKeyStrategy);
    authService = module.get(AuthService);
  });

  it('devrait extraire la clé API des en-têtes HTTP', async () => {
    const mockRequest = {
      headers: { 'x-api-key': 'test-api-key' },
      query: {},
    } as unknown as Request;

    const mockApiKey: ApiKey = {
      id: 'abc123',
      key: 'test-api-key',
      isActive: true,
      name: 'Test API Key',
      rateLimit: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validateApiKeySpy = jest
      .spyOn(authService, 'validateApiKey')
      .mockResolvedValue(mockApiKey);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await strategy.validate(mockRequest);

    expect(validateApiKeySpy).toHaveBeenCalledWith('test-api-key');
    expect(result).toEqual({ apiKeyId: 'abc123' });
  });

  it('devrait extraire la clé API des paramètres de requête', async () => {
    const mockRequest = {
      headers: {},
      query: { apiKey: 'test-api-key' },
    } as unknown as Request;

    const mockApiKey: ApiKey = {
      id: 'def456',
      key: 'test-api-key',
      isActive: true,
      name: 'Query API Key',
      rateLimit: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validateApiKeySpy = jest
      .spyOn(authService, 'validateApiKey')
      .mockResolvedValue(mockApiKey);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await strategy.validate(mockRequest);

    expect(validateApiKeySpy).toHaveBeenCalledWith('test-api-key');
    expect(result).toEqual({ apiKeyId: 'def456' });
  });

  it('devrait donner la priorité à la clé API des en-têtes sur les paramètres de requête', async () => {
    const mockRequest = {
      headers: { 'x-api-key': 'header-api-key' },
      query: { apiKey: 'query-api-key' },
    } as unknown as Request;

    const mockApiKey: ApiKey = {
      id: 'ghi789',
      key: 'header-api-key',
      isActive: true,
      name: 'Header API Key',
      rateLimit: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validateApiKeySpy = jest
      .spyOn(authService, 'validateApiKey')
      .mockResolvedValue(mockApiKey);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await strategy.validate(mockRequest);

    expect(validateApiKeySpy).toHaveBeenCalledWith('header-api-key');
    expect(result).toEqual({ apiKeyId: 'ghi789' });
  });

  it("devrait lancer une UnauthorizedException si aucune clé API n'est fournie", async () => {
    const mockRequest = {
      headers: {},
      query: {},
    } as unknown as Request;

    const validateApiKeySpy = jest.spyOn(authService, 'validateApiKey');

    await expect(strategy.validate(mockRequest)).rejects.toThrow(
      new UnauthorizedException('Clé API manquante'),
    );
    expect(validateApiKeySpy).not.toHaveBeenCalled();
  });

  it("devrait transmettre l'exception levée par validateApiKey", async () => {
    const mockRequest = {
      headers: { 'x-api-key': 'invalid-key' },
      query: {},
    } as unknown as Request;

    const error = new UnauthorizedException('Clé API invalide ou expirée');
    const validateApiKeySpy = jest
      .spyOn(authService, 'validateApiKey')
      .mockRejectedValue(error);

    await expect(strategy.validate(mockRequest)).rejects.toThrow(error);
    expect(validateApiKeySpy).toHaveBeenCalledWith('invalid-key');
  });
});
