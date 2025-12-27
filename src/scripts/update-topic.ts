
import { DataSource } from 'typeorm';
import { Topic } from '../topics/topic.entity';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'postgres',
    entities: [Topic],
    synchronize: false,
});

async function updateTopic() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const topicRepo = AppDataSource.getRepository(Topic);

        // Find the topic with title "탕수육"
        const topic = await topicRepo.findOne({ where: { title: '탕수육' } });

        if (topic) {
            topic.title = '탕수육 논쟁';
            await topicRepo.save(topic);
            console.log(`Topic updated: "${topic.title}"`);
        } else {
            console.log('Topic "탕수육" not found. Searching for partial matches...');
            // Fallback: search for anything containing 탕수육
            const similar = await topicRepo
                .createQueryBuilder('topic')
                .where('topic.title LIKE :search', { search: '%탕수육%' })
                .getOne();

            if (similar) {
                console.log(`Found similar topic: "${similar.title}". Updating to "탕수육 논쟁"...`);
                similar.title = '탕수육 논쟁';
                await topicRepo.save(similar);
                console.log('Update successful.');
            } else {
                console.log('No matching topic found.');
            }
        }

    } catch (error) {
        console.error('Error updating topic:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

updateTopic();
