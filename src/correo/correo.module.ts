import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CorreoService } from './correo.service';
import { Correo, CorreoSchema } from './schemas/correo.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Correo.name, schema: CorreoSchema }])
  ],
  providers: [CorreoService],
  exports: [CorreoService],
})
export class CorreoModule {}