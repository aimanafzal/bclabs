/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { PriceService } from './price.service';

@Controller('price')
export class PriceController {
	constructor(private priceService: PriceService) { }

	@Get('prices')
	async getHourlyPrices(@Query('chain') chain: string) {
		return this.priceService.getHourlyPrices(chain);
	}

	@Get('swap-rate')
	async getSwapRate(@Query('ethAmount') ethAmount: number) {
		return this.priceService.getSwapRate(ethAmount);
	}

	@Post('set-alert')
	async setAlert(
		@Body('chain') chain: string,
		@Body('dollar') dollar: number,
		@Body('email') email: string
	) {
		return this.priceService.setAlert(chain, dollar, email);
	}
}
