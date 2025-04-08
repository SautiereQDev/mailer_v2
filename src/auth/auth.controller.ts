import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyAuthGuard } from './guards/api-key.guard';
import { ApiKey } from './entities/api-key.entity';

@Controller('/api-keys')
export class ApiKeyController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @UseGuards(ApiKeyAuthGuard)
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto) {
    const { apiKey, rawKey } =
      await this.authService.createApiKey(createApiKeyDto);

    return {
      message: 'Clé API créée avec succès',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        isActive: apiKey.isActive,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
      },
      key: rawKey,
    };
  }

  @Get()
  @UseGuards(ApiKeyAuthGuard)
  async getAllApiKeys() {
    // Assurez-vous que cette méthode existe dans votre service AuthService
    const apiKeys: ApiKey[] = await this.authService.getApiKeys(); // Renommé selon la méthode disponible

    return apiKeys.map((key: ApiKey) => ({
      id: key.id,
      name: key.name,
      description: key.description,
      isActive: key.isActive,
      rateLimit: key.rateLimit,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));
  }

  @Delete(':id')
  @UseGuards(ApiKeyAuthGuard)
  async revokeApiKey(@Param('id') id: string) {
    await this.authService.revokeApiKey(id);
    return { message: 'Clé API révoquée avec succès' };
  }
}
