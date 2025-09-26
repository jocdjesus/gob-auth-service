import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    maxlength: [60, 'El nombre no puede exceder 60 caracteres'],
    trim: true
  })
  name: string;

  @Prop({
    required: [true, 'El correo es requerido'],
    unique: true,
    match: [/.+@.+\..+/, 'Por favor ingrese un correo válido'],
    lowercase: true,
    trim: true
  })
  email: string;

  @Prop({
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  })
  password: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};