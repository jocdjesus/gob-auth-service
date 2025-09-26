import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[a-zA-Z]{3,}\.[a-zA-Z]{3,}@puebla\.gob\.mx$/, {
    message: 'Formato incorrecto. Ejemplo válido: alejandro.armenta@puebla.gob.mx'
  })
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsNotEmpty()
  confirmPassword: string;
}