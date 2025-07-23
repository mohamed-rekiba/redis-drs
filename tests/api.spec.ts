import { RedisOptions } from 'ioredis';
import { resolve } from 'path';
import { RedisDRS } from '../src';
import { startContainer, deleteContainer, IContainer } from './utils';

const dumpFile = resolve(__dirname, 'dump.csv');
const newDumpFile = resolve(__dirname, 'new-dump.csv');

describe('api endpoints', () => {
    let sourceRedis: RedisDRS;
    let targetRedis: RedisDRS;
    let container: IContainer;

    beforeAll(async () => {
        container = await startContainer();
        sourceRedis = new RedisDRS({
            options: { port: container.port, db: 0 },
        });
        targetRedis = new RedisDRS({
            options: { port: container.port, db: 1 },
        });
    });

    afterAll(async () => {
        sourceRedis.disconnect();
        targetRedis.disconnect();
        await deleteContainer(container.name);
    });

    test('Test redis set and get', async () => {
        const key = 'hash-key';
        const message = 'Hello world';
        await sourceRedis.setOne({
            key,
            value: { message },
            type: 'hash',
            expireAt: 10,
        });
        const data = await sourceRedis.getOne(key);

        expect(data.value.message).toEqual(message);
    });

    test('Test redis restore', async () => {
        const data = sourceRedis.restore({ filePath: dumpFile });
        const total = (await data.next()).value as number;

        for await (const _val of data);
        const keys = await sourceRedis.keys('*');

        expect(total).toEqual(keys.length);
    });

    test('Test redis dump', async () => {
        const data = sourceRedis.dump({ filePath: newDumpFile });
        const total = (await data.next()).value as number;

        for await (const _val of data);
        const keys = await sourceRedis.keys('*');

        expect(total).toEqual(keys.length);
    });

    test('Test redis sync', async () => {
        const data = sourceRedis.sync({
            targetRedisOptions: <RedisOptions>{
                options: { port: container.port, db: 1 },
            },
        });
        const total = (await data.next()).value as number;

        for await (const _val of data);
        const tKeys = await targetRedis.keys('*');

        expect(total).toEqual(tKeys.length);
    });
});
