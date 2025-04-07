import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/contact-mail.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @UseGuards(ApiKeyGuard)
  async sendMail(
    @Body() contactMailDto: SendMailDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.mailService.sendContactMail(contactMailDto);
    return { message: 'Email envoyé avec succès', success: true };
  }
}
