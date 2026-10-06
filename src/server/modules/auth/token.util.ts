import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, {
    // JWT_EXPIRES_IN is a free-form env string (e.g. '7d'); jsonwebtoken validates it at runtime.
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}
