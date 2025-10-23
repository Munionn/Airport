import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class AuthResponseDto {
  user: {
    user_id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth?: string;
    passport_number?: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
  };
  roles: {
    role_id: number;
    role_name: string;
    description?: string;
    permissions: Record<string, string[]>;
    created_at: string;
  }[];
}
