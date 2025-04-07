import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'node:path';
import * as fs from 'node:fs';
import Handlebars from 'handlebars';
import { SendMailDto } from './dto/contact-mail.dto';

export interface SentMessageInfo {
  messageId: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const isTestEnv = process.env.NODE_ENV === 'test';

    if (isTestEnv) {
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT'),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendContactMail(mailData: SendMailDto): Promise<SentMessageInfo> {
    try {
      const templatePath = path.join(process.cwd(), 'views', 'mail.hbs');
      let html: string;

      try {
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(templateSource);
        const context = {
          ...mailData,
          title: `Message de contact de ${mailData.name}`,
          currentYear: new Date().getFullYear(),
        };
        html = template(context);
      } catch (err) {
        this.handleTemplateError(err);
        html = `<h1>Message de ${mailData.name}</h1><p>${mailData.message}</p>`;
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: mailData.email,
        to: this.configService.get<string>('MAIL_TO') ?? 'contact@example.com',
        subject: 'Nouveau message de contact',
        html,
      };

      const info = (await this.transporter.sendMail(
        mailOptions,
      )) as SentMessageInfo;
      this.logger.log(`Message envoyé: ${info.messageId}`);
      return info;
    } catch (error: unknown) {
      this.handleSendMailError(error);
      throw error;
    }
  }

  private handleTemplateError(err: unknown): void {
    if (err instanceof Error) {
      this.logger.error(
        `Erreur lors de la lecture du template: ${err.message}`,
      );
    } else {
      this.logger.error(
        'Erreur lors de la lecture du template: erreur inconnue',
      );
    }
    this.logger.warn('Utilisation du template par défaut pour les tests');
  }

  private handleSendMailError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur inconnue';
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.logger.error(
      `Erreur lors de l'envoi du mail: ${errorMessage}`,
      errorStack,
    );
  }
}
