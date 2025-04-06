import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getApiInfo: jest.fn().mockReturnValue({
              name: 'Test API',
              version: '1.0.0',
              description: 'API de test',
              endpoints: [{ path: '/', method: 'GET' }],
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('should render mail template with API info', () => {
    const result = appController.root();

    expect(appService.getApiInfo).toHaveBeenCalled();
    expect(result).toEqual({
      name: 'Test API',
      version: '1.0.0',
      description: 'API de test',
      endpoints: [{ path: '/', method: 'GET' }],
    });
  });

  it('should return API info data as template context', () => {
    const mockApiInfo = {
      name: 'Contact API',
      version: '2.0.0',
      endpoints: [],
    };
    jest.spyOn(appService, 'getApiInfo').mockReturnValueOnce(mockApiInfo);

    const result = appController.root();

    expect(result).toBe(mockApiInfo);
  });

  it('should handle empty API info gracefully', () => {
    jest.spyOn(appService, 'getApiInfo').mockReturnValueOnce({});

    const result = appController.root();

    expect(result).toEqual({});
  });
});
