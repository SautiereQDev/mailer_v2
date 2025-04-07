import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      throw new UnauthorizedException('Clé API manquante');
    }

    const validatedApiKey = await this.authService.validateApiKey(apiKey);
    return { apiKeyId: validatedApiKey.id };
  }

  private extractApiKey(req: Request): string | undefined {
    const key =
      (req.headers['x-api-key'] as string) || (req.query.apiKey as string);
    return key;
  }
}
