import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { CorreoService } from '../correo/correo.service';
import { CheckEmailDto } from './dto/check-email.dto';
import { SaveEmailDto } from './dto/save-email.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { User } from '../user/schemas/user.schema';
import type { Correo } from '../correo/schemas/correo.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly correoService: CorreoService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async checkEmail(checkEmailDto: CheckEmailDto) {
    const { email } = checkEmailDto;
    
    const [inUsers, inCorreos] = await Promise.all([
      this.userService.findByEmail(email),
      this.correoService.findByEmail(email)
    ]);

    return {
      existsInUsers: !!inUsers,
      existsInCorreos: !!inCorreos
    };
  }

  async saveEmail(saveEmailDto: SaveEmailDto) {
    const { email } = saveEmailDto;

    // Validar formato de correo
    if (!email.endsWith('@puebla.gob.mx')) {
      throw new BadRequestException('Debe ser un correo institucional (@puebla.gob.mx)');
    }

    const emailRegex = /^[a-zA-Z]{3,}\.[a-zA-Z]{3,}@puebla\.gob\.mx$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Formato incorrecto. Ejemplo válido: alejandro.armenta@puebla.gob.mx');
    }

    // Verificar si ya existe en usuarios
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El usuario ya está registrado');
    }

    // Verificar si ya existe en correos
    const existingCorreo = await this.correoService.findByEmail(email);
    if (existingCorreo) {
      throw new ConflictException('El correo ya ha sido procesado');
    }

    // Guardar el correo
    const newCorreo = await this.correoService.create({ email });

    // Generar token temporal usando JWT_TEMP_EXPIRATION
    const token = this.jwtService.sign(
      { email: newCorreo.email, temp: true },
       { expiresIn: '300s' }
    );

    return {
      success: true,
      token,
      email: newCorreo.email,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, confirmPassword } = registerDto;

    // Validaciones
    if (password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    // Verificar si el correo existe en la tabla de correos temporales
    const correoExistente = await this.correoService.findByEmail(email);
    if (!correoExistente) {
      throw new BadRequestException('Debes registrar tu correo primero');
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await this.userService.findByEmail(email);
    if (usuarioExistente) {
      throw new ConflictException('El usuario ya está registrado');
    }

    // Crear usuario
    const newUser = await this.userService.create({ email, password });

    // Asegurar que _id es un string usando toString()
    const userId = (newUser as any)._id?.toString ? (newUser as any)._id.toString() : String((newUser as any)._id);

    // Generar token usando JWT_EXPIRATION
    const token = this.jwtService.sign(
      { id: userId, email: newUser.email },
      { expiresIn: this.configService.get('JWT_EXPIRATION', '8h') }
    );

    // Eliminar la contraseña del objeto de respuesta
    const userResponse = {
      id: userId,
      email: newUser.email,
      createdAt: newUser.createdAt
    };

    return {
      success: true,
      token,
      user: userResponse
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Validar que se proporcionen ambos campos
    if (!email || !password) {
      throw new BadRequestException('Correo y contraseña son requeridos');
    }

    // Buscar usuario incluyendo la contraseña
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Asegurar que _id es un string
    const userId = (user as any)._id?.toString ? (user as any)._id.toString() : String((user as any)._id);

    // Generar token usando JWT_EXPIRATION
    const token = this.jwtService.sign(
      { 
        id: userId,
        email: user.email,
        name: user.name 
      }, 
      { expiresIn: this.configService.get('JWT_EXPIRATION', '8h') }
    );

    // Omitir la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      success: true,
      token,
      user: userWithoutPassword
    };
  }

  async validateUser(payload: any) {
    const user = await this.userService.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }
    return user;
  }
}