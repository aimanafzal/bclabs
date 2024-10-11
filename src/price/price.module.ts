/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { PriceHistory } from '../entities/price.entity';

@Module({
	imports: [TypeOrmModule.forFeature([PriceHistory]), HttpModule],
	providers: [PriceService],
	controllers: [PriceController],
})
export class PriceModule { }
