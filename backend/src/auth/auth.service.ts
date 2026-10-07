import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được đăng ký');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
    });

    return {
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        email: user.email,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không đúng',
      );
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không đúng',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
    };
  }
}