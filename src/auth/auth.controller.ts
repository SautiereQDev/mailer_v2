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
import { ApiKey } from './entities/api-key.entity';
import { JwtAuthGuard } from './guards/api-key.guard';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeyController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  create(@Body() createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    return this.authService.createApiKey(createApiKeyDto);
  }

  @Get()
  findAll(): Promise<ApiKey[]> {
    return this.authService.getAllApiKeys();
  }

  @Delete(':id')
  revoke(@Param('id') id: string): Promise<void> {
    return this.authService.revokeApiKey(id);
  }
}
