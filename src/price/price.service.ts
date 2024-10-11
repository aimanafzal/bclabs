/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { PriceHistory } from '../entities/price.entity';
import * as nodemailer from 'nodemailer';
import { Alert } from 'src/entities/alert.entity';

@Injectable()
export class PriceService {
	constructor(
		private httpService: HttpService,
		@InjectRepository(PriceHistory) private priceRepo: Repository<PriceHistory>,
		@InjectRepository(Alert) private alertRepo: Repository<Alert>,  // Inject alert repository
	) { }


	@Cron('*/5 * * * *')
	async fetchPrices() {
		const ethPrice = await this.fetchPrice('eth');
		const maticPrice = await this.fetchPrice('polygon');

		await this.priceRepo.save({ chain: 'eth', price: ethPrice });
		await this.priceRepo.save({ chain: 'polygon', price: maticPrice });
	}

	private async fetchPrice(chain: string) {
		const url = chain === 'eth' ? 'MORALIS_ETH_API_URL' : 'MORALIS_MATIC_API_URL';
		const response = await this.httpService.get(url).toPromise();
		return response.data.usd;
	}


	async getHourlyPrices(chain: string) {
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);


		return this.priceRepo.find({
			where: { chain, timestamp: MoreThan(oneDayAgo) },
			order: { timestamp: 'ASC' },
		});
	}


	async checkPriceChange() {
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
		const recentPrices = await this.priceRepo.find({ where: { timestamp: MoreThan(oneHourAgo) } });

		for (const price of recentPrices) {
			const increased = await this.hasIncreasedByThreePercent(price);
			if (increased) {
				this.sendPriceAlert(price.chain);
			}
		}
	}
	private async hasIncreasedByThreePercent(price: PriceHistory): Promise<boolean> {
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);


		const priceOneHourAgo = await this.priceRepo.findOne({
			where: { chain: price.chain, timestamp: MoreThan(oneHourAgo) },
			order: { timestamp: 'ASC' },
		});

		if (!priceOneHourAgo) {
			return false;
		}

		const percentageIncrease = ((price.price - priceOneHourAgo.price) / priceOneHourAgo.price) * 100;

		return percentageIncrease > 3;
	}

	async setAlert(chain: string, targetPrice: number, email: string): Promise<Alert> {
		const newAlert = this.alertRepo.create({ chain, targetPrice, email });
		return await this.alertRepo.save(newAlert);
	}


	async checkAlerts(price: PriceHistory) {
		const alerts = await this.alertRepo.find({ where: { chain: price.chain } });

		for (const alert of alerts) {
			if (price.price >= alert.targetPrice) {
				this.sendPriceAlert(alert.email, price.chain, alert.targetPrice);
				await this.alertRepo.remove(alert);
			}
		}
	}
	private async sendPriceAlert(email?: string, chain?: string, targetPrice?: number) {
		const transporter = nodemailer.createTransport({
			service: process.env.service,
			auth: {
				user: process.env.email,
				pass: process.env.password,
			},
		});

		await transporter.sendMail({
			from: process.env.email,
			to: email,
			subject: `Price Alert for ${chain}`,
			text: `The price of ${chain} has reached ${targetPrice} USD!`,
		});
	}

	async getSwapRate(ethAmount: number): Promise<{ btcAmount: number, fee: { eth: number, usd: number } }> {

		const ethBtcRate = await this.fetchEthBtcRate();
		const ethUsdRate = await this.fetchPrice('eth');

		const btcAmount = ethAmount * ethBtcRate;

		const feePercentage = 0.03 / 100;
		const ethFee = ethAmount * feePercentage;
		const usdFee = ethFee * ethUsdRate;

		return {
			btcAmount: btcAmount - (btcAmount * feePercentage),
			fee: { eth: ethFee, usd: usdFee }
		};
	}

	private async fetchEthBtcRate(): Promise<number> {
		const response = await this.httpService.get(process.env.ETH_BTC_CONVERSION).toPromise();
		return response.data.rate;
	}


}
