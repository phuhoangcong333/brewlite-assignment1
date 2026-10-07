import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface User {
  id: number;
  email: string;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  private readonly users: User[] = [];
  private nextUserId = 1;

  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const existingUser = this.users.find(
      (user) => user.email === dto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email đã được đăng ký');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user: User = {
      id: this.nextUserId++,
      email: dto.email,
      passwordHash,
    };

    this.users.push(user);

    return {
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = this.users.find(
      (item) => item.email === dto.email,
    );

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

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
    };
  }
}