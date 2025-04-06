import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

describe('MailController', () => {
  let controller: MailController;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: {
            sendContactMail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should send mail with valid data', async () => {
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'ACME Inc',
      message: 'Hello, this is a test message',
    };

    const result = await controller.sendMail(mailData);

    expect(mailService.sendContactMail).toHaveBeenCalledWith(mailData);
    expect(result).toEqual({
      success: true,
      message: 'Email envoyé avec succès',
    });
  });

  it('should send mail without company name', async () => {
    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message',
    };

    const result = await controller.sendMail(mailData);

    expect(mailService.sendContactMail).toHaveBeenCalledWith(mailData);
    expect(result).toEqual({
      success: true,
      message: 'Email envoyé avec succès',
    });
  });

  it('should handle service error gracefully', async () => {
    jest
      .spyOn(mailService, 'sendContactMail')
      .mockRejectedValueOnce(new Error('Mail service error'));

    const mailData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message',
    };

    await expect(controller.sendMail(mailData)).rejects.toThrow(
      'Mail service error',
    );
  });
});
