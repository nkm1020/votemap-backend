
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Vote } from '../votes/vote.entity';
import { Topic } from '../topics/topic.entity';
import { Follow } from '../follows/follow.entity';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file in root
config({ path: path.join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'postgres',
    entities: [User, Vote, Topic, Follow],
    synchronize: false,
});

async function countUsers() {
    try {
        await AppDataSource.initialize();
        const userRepo = AppDataSource.getRepository(User);
        const count = await userRepo.count();
        console.log(`Total Users: ${count}`);
    } catch (error) {
        console.error('Error counting users:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

countUsers();
