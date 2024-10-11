/* eslint-disable prettier/prettier */
import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from 'typeorm';

@Entity('price_history')
export class PriceHistory {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	chain: string;

	@Column('decimal')
	price: number;

	@CreateDateColumn()
	timestamp: Date;
}
