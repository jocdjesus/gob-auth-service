import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Simulación simple de rate limiting
const rateLimitStore = new Map();

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const currentTime = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 100; // Máximo 100 solicitudes por ventana

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, { count: 1, startTime: currentTime });
    } else {
      const ipData = rateLimitStore.get(ip);
      
      if (currentTime - ipData.startTime > windowMs) {
        // Reiniciar contador si la ventana ha expirado
        ipData.count = 1;
        ipData.startTime = currentTime;
      } else {
        // Incrementar contador
        ipData.count++;
        
        if (ipData.count > maxRequests) {
          return res.status(429).json({
            success: false,
            error: 'Demasiadas solicitudes, por favor intente más tarde'
          });
        }
      }
    }

    next();
  }
}