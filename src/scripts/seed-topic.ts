
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
            const topic1 = topicRepo.create({
                title: title,
                option_a: '민초파',
                option_a_tags: '#미식가,#개취존중,#상쾌함',
                option_b: '반민초파',
                option_b_tags: '#전통파,#안전지향,#치약맛NO',
                status: TopicStatus.ONGOING
            });
            await topicRepo.save(topic1);
            console.log(`Topic "${title}" created.`);

            // Add more topics for persona testing
            await topicRepo.save(topicRepo.create({
                title: '탕수육 먹는 법',
                option_a: '부먹',
                option_a_tags: '#융통성,#촉촉함,#함께',
                option_b: '찍먹',
                option_b_tags: '#미식가,#바삭함,#깔끔',
                status: TopicStatus.ONGOING
            }));

            await topicRepo.save(topicRepo.create({
                title: '깻잎 논쟁',
                option_a: '떼어줘도 된다',
                option_a_tags: '#배려,#오지랖,#자신감',
                option_b: '안된다',
                option_b_tags: '#질투,#칼차단,#내꺼',
                status: TopicStatus.ONGOING
            }));
            console.log('Added extra topics with tags.');
        }

    } catch (error) {
        console.error('Error seeding topic:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seed();
