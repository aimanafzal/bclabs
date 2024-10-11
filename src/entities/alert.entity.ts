/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Alert {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	chain: string;

	@Column()
	targetPrice: number;

	@Column()
	email: string;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;
}