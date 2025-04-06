import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post()
  async sendMail(
    @Body() mailData: SendMailDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.mailService.sendContactMail(mailData);
    return { success: true, message: 'Email envoyé avec succès' };
  }
}
