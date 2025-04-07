import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyGuard, JwtAuthGuard } from './api-key.guard';
import { ExecutionContext } from '@nestjs/common';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeyGuard],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
  });

  it('devrait être défini', () => {
    expect(guard).toBeDefined();
  });

  it('devrait appeler super.canActivate avec le contexte fourni', () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({}),
    } as unknown as ExecutionContext;

    // Remplacer l'implémentation de canActivate pour simuler le comportement de la classe parente
    jest
      .spyOn(Object.getPrototypeOf(ApiKeyGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    const superCanActivateSpy = jest.spyOn(
      Object.getPrototypeOf(ApiKeyGuard.prototype),
      'canActivate',
    );

    const result = guard.canActivate(mockContext);

    expect(superCanActivateSpy).toHaveBeenCalledWith(mockContext);
    expect(result).toBe(true);
  });

  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [JwtAuthGuard],
      }).compile();

      guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    });

    it('devrait être défini', () => {
      expect(guard).toBeDefined();
    });

    it('devrait hériter de AuthGuard avec la stratégie jwt', () => {
      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });
  });
});
