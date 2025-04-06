import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'express-handlebars';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  const hbsInstance = hbs.create({
    extname: 'hbs',
    partialsDir: join(__dirname, '..', 'views', 'partials'),
    layoutsDir: join(__dirname, '..', 'views', 'layouts'),
    defaultLayout: 'main',
  });

  app.engine('hbs', hbsInstance.engine);

  await app.listen(
    parseInt(configService.get<string>('PORT') ?? '3000', 10),
    () => {
      console.log(
        `Server is running on port ${configService.get<string>('PORT')}`,
      );
    },
  );
}

void bootstrap();
