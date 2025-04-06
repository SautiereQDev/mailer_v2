import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs';
import * as path from 'node:path';

jest.mock('nodemailer');
jest.mock('node:fs');
jest.mock('node:path');

describe('MailService', () => {
  let service: MailService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  };

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'SMTP_HOST':
                  return 'localhost';
                case 'SMTP_PORT':
                  return 1025;
                case 'MAIL_TO':
                  return 'test@example.com';
                case 'SMTP_USER':
                  return 'user';
                case 'SMTP_PASS':
                  return 'pass';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create transporter with test configuration when in test environment', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    });
  });

  it('should successfully send an email with all data', async () => {
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'ACME Inc',
      message: 'Hello, this is a test message',
    };

    // Mock fs.readFileSync to provide a template
    (fs.readFileSync as jest.Mock).mockReturnValue(
      'Template {{name}} {{message}}',
    );
    (path.join as jest.Mock).mockReturnValue('/mock/path/to/mail.hbs');

    const result = await service.sendContactMail(mailData);

    expect(mockTransporter.sendMail).toHaveBeenCalled();
    expect(result).toEqual({ messageId: 'mock-message-id' });
  });

  it('should send an email without optional company field', async () => {
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message',
    };

    // Mock fs.readFileSync to provide a template
    (fs.readFileSync as jest.Mock).mockReturnValue(
      'Template {{name}} {{message}}',
    );
    (path.join as jest.Mock).mockReturnValue('/mock/path/to/mail.hbs');

    const result = await service.sendContactMail(mailData);

    expect(mockTransporter.sendMail).toHaveBeenCalled();
    expect(result).toEqual({ messageId: 'mock-message-id' });
  });

  it('should use default template when template file cannot be read', async () => {
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message',
    };

    // Simulate error reading template file
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });
    (path.join as jest.Mock).mockReturnValue('/invalid/path/to/mail.hbs');

    const result = await service.sendContactMail(mailData);

    expect(mockTransporter.sendMail).toHaveBeenCalled();
    expect(result).toEqual({ messageId: 'mock-message-id' });
  });

  it('should throw an error when email sending fails', async () => {
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message',
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(
      'Template {{name}} {{message}}',
    );
    (path.join as jest.Mock).mockReturnValue('/mock/path/to/mail.hbs');

    // Simulate mail sending error
    mockTransporter.sendMail.mockRejectedValueOnce(
      new Error('Failed to send email'),
    );

    await expect(service.sendContactMail(mailData)).rejects.toThrow(
      'Failed to send email',
    );
  });

  it('should create transporter with production configuration when not in test environment', async () => {
    // Re-instantiate service with production environment
    process.env.NODE_ENV = 'production';
    (nodemailer.createTransport as jest.Mock).mockClear();

    await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'SMTP_HOST':
                  return 'smtp.example.com';
                case 'SMTP_PORT':
                  return 587;
                case 'SMTP_SECURE':
                  return true;
                case 'SMTP_USER':
                  return 'user@example.com';
                case 'SMTP_PASS':
                  return 'password';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    // The transporter should be created with production config
    expect(nodemailer.createTransport).toHaveBeenCalled();

    interface TransporterConfig {
      host: string;
      port: number;
      secure: boolean;
      auth?: {
        user: string;
        pass: string;
      };
    }

    const mockCalls = (nodemailer.createTransport as jest.Mock).mock.calls;
    const transporterConfig =
      mockCalls.length > 0
        ? (mockCalls[0][0] as TransporterConfig)
        : ({} as TransporterConfig);
    expect(transporterConfig.host).toBe('smtp.example.com');
    expect(transporterConfig.port).toBe(587);
    expect(transporterConfig.secure).toBe(true);
  });

  it('devrait capturer et logger les erreurs lors de la lecture du template', async () => {
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message',
    };

    // Simuler l'erreur de lecture du fichier template avec un message spécifique
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    // Espionner le logger NestJS au lieu de console.error
    const loggerErrorSpy = jest
      .spyOn(service['logger'], 'error')
      .mockImplementation();

    await service.sendContactMail(mailData);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Erreur lors de la lecture du template'),
    );
    loggerErrorSpy.mockRestore();
  });

  it('devrait envoyer un email avec des caractères spéciaux dans les données', async () => {
    const mailData = {
      name: 'François Müller',
      email: 'francois@example.com',
      company: 'Société Générale',
      message: 'Voici un message avec des caractères spéciaux: é à ç ù € ñ',
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(
      'Template {{name}} {{message}}',
    );

    const result = await service.sendContactMail(mailData);

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String) as string,
        from: expect.any(String) as string,
        subject: expect.any(String) as string,
        html: expect.stringContaining(mailData.name) as string,
      }),
    );
    expect(result).toEqual({ messageId: 'mock-message-id' });
  });

  it('devrait gérer correctement les messages très longs', async () => {
    const longMessage = 'a'.repeat(10000); // Message de 10 000 caractères
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: longMessage,
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(
      'Template {{name}} {{message}}',
    );

    await service.sendContactMail(mailData);

    expect(mockTransporter.sendMail).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs de template avec des balises manquantes', async () => {
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message',
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(
      'Template with missing tag {{missing}}',
    );

    await service.sendContactMail(mailData);

    expect(mockTransporter.sendMail).toHaveBeenCalled();
  });
});
