import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { Public } from '../../../../common/auth/public.decorator';
import type { AuthenticatedUser } from '../../../../common/auth/jwt.strategy';
import { AuthService } from '../../application/auth.service';
import { LoginRequestDto } from './login-request.dto';
import { LoginResponseDto } from './login-response.dto';
import { ProfileResponseDto } from './profile-response.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate HR Manager' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getProfile(@Req() req: AuthenticatedRequest): ProfileResponseDto {
    return req.user;
  }
}
