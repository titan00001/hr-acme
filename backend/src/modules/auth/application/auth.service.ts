import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginRequestDto } from '../adapters/inbound/login-request.dto';
import { LoginResponseDto } from '../adapters/inbound/login-response.dto';
import { parseExpiresInToSeconds } from './parse-expires-in.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const username = this.configService.getOrThrow<string>('HR_USERNAME');
    const password = this.configService.getOrThrow<string>('HR_PASSWORD');

    if (dto.username !== username || dto.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const expiresInConfig = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '8h',
    );
    const accessToken = await this.jwtService.signAsync({
      sub: dto.username,
    });

    return {
      accessToken,
      expiresIn: parseExpiresInToSeconds(expiresInConfig),
    };
  }
}
