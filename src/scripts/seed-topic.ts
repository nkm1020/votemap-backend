
import { DataSource } from 'typeorm';
import { Topic, TopicStatus } from '../topics/topic.entity';
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
    entities: [Topic],
    synchronize: false, // Don't sync, just use existing
});

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const topicRepo = AppDataSource.getRepository(Topic);

        const title = '민트 초코 논쟁';
        const existing = await topicRepo.findOne({ where: { title } });

        if (existing) {
            console.log(`Topic "${title}" already exists.`);
        } else {
            const newTopic = topicRepo.create({
                title: title,
                option_a: '민초파',
                option_b: '반민초파',
                status: TopicStatus.ONGOING
            });
            await topicRepo.save(newTopic);
            console.log(`Topic "${title}" created successfully!`);
        }

    } catch (error) {
        console.error('Error seeding topic:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seed();
