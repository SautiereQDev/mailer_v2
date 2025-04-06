import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigService],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService, ConfigService],
})
export class MailModule {}
