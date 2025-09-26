import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Correo extends Document {
  @Prop({
    required: [true, 'El correo es requerido'],
    unique: true,
    match: [/.+@.+\..+/, 'Por favor ingrese un correo válido'],
    lowercase: true,
    trim: true
  })
  email: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CorreoSchema = SchemaFactory.createForClass(Correo);

CorreoSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('El correo ya está registrado'));
  } else {
    next(error);
  }
});