import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key) => (key === 'JWT_SECRET' ? 'test-secret' : undefined)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    configService = module.get(ConfigService);
    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('devrait accepter un payload avec isAdmin à true', () => {
    const payload = { isAdmin: true, userId: '123' };

    const result = strategy.validate(payload);

    expect(result).toEqual(payload);
  });

  it('devrait rejeter un payload avec isAdmin à false', () => {
    const payload = { isAdmin: false, userId: '123' };

    expect(() => strategy.validate(payload)).toThrow(
      new UnauthorizedException('Accès réservé aux administrateurs'),
    );
  });

  it('devrait rejeter un payload sans la propriété isAdmin', () => {
    const payload = { userId: '123' };

    expect(() => strategy.validate(payload)).toThrow(
      new UnauthorizedException('Accès réservé aux administrateurs'),
    );
  });

  it('devrait rejeter un payload avec isAdmin non défini', () => {
    const payload = { isAdmin: undefined, userId: '123' };

    expect(() => strategy.validate(payload)).toThrow(
      new UnauthorizedException('Accès réservé aux administrateurs'),
    );
  });

  it("devrait lever une erreur si JWT_SECRET n'est pas défini", () => {
    // Redéfinit le mock pour ce test spécifique
    jest.spyOn(configService, 'get').mockReturnValue(undefined);

    expect(() => new JwtStrategy(configService)).toThrow(
      new Error("JWT_SECRET n'est pas défini"),
    );
  });
});
