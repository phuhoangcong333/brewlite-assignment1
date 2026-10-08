import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự',
  })
  @Matches(/[A-Z]/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa',
  })
  @Matches(/[a-z]/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ thường',
  })
  @Matches(/[0-9]/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ số',
  })
  password: string;
}