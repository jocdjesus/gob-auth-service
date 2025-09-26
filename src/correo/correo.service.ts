import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Correo } from './schemas/correo.schema';

@Injectable()
export class CorreoService {
  constructor(
    @InjectModel(Correo.name) private correoModel: Model<Correo>,
  ) {}

  async findByEmail(email: string): Promise<Correo | null> {
    return this.correoModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<Correo | null> {
    return this.correoModel.findById(id).exec();
  }

  async create(correoData: Partial<Correo>): Promise<Correo> {
    const correo = new this.correoModel(correoData);
    return correo.save();
  }

  async findAll(): Promise<Correo[]> {
    return this.correoModel.find().exec();
  }

  async delete(id: string): Promise<void> {
    const result = await this.correoModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('Correo no encontrado');
    }
  }
}