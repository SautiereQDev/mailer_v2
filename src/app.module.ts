import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from './mail/mail.module';
import Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      cache: true,
      expandVariables: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.string().default('3000'),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        SMTP_SECURE: Joi.boolean().default(false),
        MAIL_TO: Joi.string()
          .email()
          .default('mailto:contac@quentinsautiere.com'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
