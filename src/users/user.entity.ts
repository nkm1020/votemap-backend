import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    phone_number: string;

    @Column()
    nickname: string;

    @Column({ nullable: true })
    verified_region: string;

    @CreateDateColumn()
    created_at: Date;
}
