import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        HR_USERNAME: 'admin',
        HR_PASSWORD: 'secret',
      };
      return values[key];
    }),
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'JWT_EXPIRES_IN') {
        return '8h';
      }
      return defaultValue;
    }),
  };

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('returns a JWT for valid credentials', async () => {
    const result = await service.login({
      username: 'admin',
      password: 'secret',
    });

    expect(result).toEqual({
      accessToken: 'signed-token',
      expiresIn: 28800,
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'admin' });
  });

  it('throws UnauthorizedException for invalid credentials', async () => {
    await expect(
      service.login({ username: 'admin', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
