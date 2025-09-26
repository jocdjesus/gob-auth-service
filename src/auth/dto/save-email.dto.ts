import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class SaveEmailDto {
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[a-zA-Z]{3,}\.[a-zA-Z]{3,}@puebla\.gob\.mx$/, {
    message: 'Formato incorrecto. Ejemplo válido: alejandro.armenta@puebla.gob.mx'
  })
  email: string;
}