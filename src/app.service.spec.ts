import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

jest.mock('../package.json', () => ({
  version: '1.0.0',
  description: 'Test description',
}));

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should return API information with correct structure', () => {
    const apiInfo = service.getApiInfo();

    expect(apiInfo).toBeDefined();
    expect(apiInfo.name).toBe('Mailer API');
    expect(apiInfo.author).toBe('Quentin Sautière');
    expect(apiInfo.contact).toBe('contact@quentinsautiere.com');
    expect(apiInfo.endpoints).toBeDefined();
    expect(apiInfo.authentication).toBeDefined();
  });

  it('should include package.json version and description', () => {
    const apiInfo = service.getApiInfo();

    expect(apiInfo.version).toBe('1.0.0');
    expect(apiInfo.description).toBe('Test description');
  });

  it('should include authentication information', () => {
    const apiInfo = service.getApiInfo();

    expect(apiInfo.authentication.publicEndpoints).toBeDefined();
    expect(apiInfo.authentication.publicEndpoints.methods).toHaveLength(2);
    expect(apiInfo.authentication.adminEndpoints).toBeDefined();
  });

  it('should include endpoints information', () => {
    const apiInfo = service.getApiInfo();

    expect(apiInfo.endpoints.base).toBeInstanceOf(Array);
    expect(apiInfo.endpoints.apiKeys).toBeInstanceOf(Array);
    expect(apiInfo.endpoints.base.length).toBeGreaterThan(0);
    expect(apiInfo.endpoints.apiKeys.length).toBeGreaterThan(0);
  });

  it('should handle missing package.json values gracefully', () => {
    jest.resetModules();
    jest.mock('../package.json', () => ({}));

    const apiInfo = service.getApiInfo();

    expect(apiInfo.version).toBeDefined();
    expect(apiInfo.description).toBeDefined();
  });

  it('should include error codes documentation', () => {
    const apiInfo = service.getApiInfo();

    expect(apiInfo.errors).toBeDefined();
    expect(apiInfo.errors.authentication['401']).toBeDefined();
    expect(apiInfo.errors.validation['400']).toBeDefined();
    expect(apiInfo.errors.server['500']).toBeDefined();
    expect(apiInfo.errors.notFound['404']).toBeDefined();
    expect(apiInfo.errors.rateLimit['429']).toBeDefined();
  });
});
