import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db, users } from '../db/drizzle.js';
import { env } from '../config/env.js';
import { BadRequestError, UnauthorizedError } from '../utils/httpErrors.js';

export class AuthService {
  static async register({ email, password, name }) {
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing.length > 0) {
      throw new BadRequestError('Email address is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
      })
      .returning();

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }

  static async login({ email, password }) {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }

  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      env.jwt.secret,
      {
        expiresIn: env.jwt.expiresIn,
      }
    );
  }
}
