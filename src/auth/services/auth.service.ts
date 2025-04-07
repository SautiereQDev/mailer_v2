import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ApiKey } from '../entities/api-key.entity';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async validateApiKey(key: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key, isActive: true },
    });

    if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
      throw new UnauthorizedException('Clé API invalide ou expirée');
    }

    return apiKey;
  }

  async createApiKey(createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    const key = this.generateApiKey();
    const apiKey = this.apiKeyRepository.create({
      ...createApiKeyDto,
      key,
    });

    return this.apiKeyRepository.save(apiKey);
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return this.apiKeyRepository.find();
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.apiKeyRepository.update(id, { isActive: false });
  }

  private generateApiKey(): string {
    return randomBytes(24).toString('hex');
  }
}
