import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ email, passwordHash, displayName });
    await this.userRepository.save(user);

    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.sanitize(user),
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.sanitize(user),
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: payload.sub } });
  }

  async getUserById(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  private sanitize(user: User): Partial<User> {
    const { passwordHash: _hash, ...rest } = user;
    return rest;
  }
}
