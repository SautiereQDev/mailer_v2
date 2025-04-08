import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ApiKey } from '../entities/api-key.entity';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly jwtService: JwtService,
  ) {}

  async validateApiKey(key: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key, isActive: true },
    });

    if (
      !apiKey ||
      (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date())
    ) {
      throw new UnauthorizedException('Clé API invalide ou expirée');
    }

    return apiKey;
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return await this.apiKeyRepository.find();
  }

  async revokeApiKey(id: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });

    if (!apiKey) {
      throw new NotFoundException(`Clé API avec l'ID ${id} non trouvée`);
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }

  async createApiKey(
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; rawKey: string }> {
    // Génération d'une clé API aléatoire
    const rawKey = randomBytes(32).toString('hex');

    // Préparation des données pour l'entité avec conversion explicite des types
    const apiKeyData: Partial<ApiKey> = {
      key: rawKey,
      name: createApiKeyDto.name,
      isActive: createApiKeyDto.isActive,
      description: createApiKeyDto.description,
      rateLimit: createApiKeyDto.rateLimit,
      expiresAt: createApiKeyDto.expiresAt
        ? new Date(createApiKeyDto.expiresAt)
        : undefined,
    };

    // Création et sauvegarde de l'entité
    const apiKey = this.apiKeyRepository.create(apiKeyData);
    await this.apiKeyRepository.save(apiKey);

    // On retourne à la fois l'entité et la clé non-hachée
    return { apiKey, rawKey };
  }
}
