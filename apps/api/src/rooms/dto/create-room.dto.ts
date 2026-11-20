import { IsString, MinLength, MaxLength, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  @Type(() => Number)
  maxViewers?: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  @Type(() => Number)
  expiresInMinutes?: number;
}
