import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { ParticipantsModule } from './participants/participants.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env', '../../.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL') || '';
        let host = 'localhost';
        let port = 5433;
        let username = 'telnet';
        let password = 'telnet_password';
        let database = 'telnet';
        if (dbUrl) {
          try {
            const parsed = new URL(dbUrl);
            host = parsed.hostname || host;
            port = parsed.port ? parseInt(parsed.port, 10) : port;
            username = decodeURIComponent(parsed.username || username);
            password = decodeURIComponent(parsed.password || password);
            database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : database;
          } catch {
            // fallback defaults
          }
        }
        return {
          type: 'postgres',
          host,
          port,
          username,
          password: String(password),
          database,
          autoLoadEntities: true,
          synchronize: true,
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    RoomsModule,
    ParticipantsModule,
  ],
})
export class AppModule {}
