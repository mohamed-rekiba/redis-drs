import Redis, { Pipeline } from 'ioredis';
import { readStream, writeStream } from './helpers/file';
import * as IRedisDRS from './model';

export class RedisDRS extends Redis {
    public version: string;
    private havePttl: boolean;
    private logger: typeof console.info;

    constructor(options: IRedisDRS.options) {
        const { path, port, host, options: _options } = options || {};

        if (path && !_options) super(path);
        else if (port && !host && !_options) super(port);
        else if (_options && !port && !host) super(_options);
        else if (path && _options) super(path, _options);
        else if (port && _options && !host) super(port, _options);
        else if (port && host && !_options) super(port, host);
        else if (port && host && _options) super(port, host, _options);
        else super();

        this.version = '';
        this.havePttl = false;

        this.logger = options.logger === true ? console.info : () => {};
    }

    async init() {
        const info = await this.info();
        const { version } =
            info.match(/redis_version:(?<version>[0-9.]+)/)?.groups || {};
        this.version = version;
        this.havePttl = Number(version.slice(0, 3)) > 2.6;
    }

    async getOne(key: string): Promise<IRedisDRS.item> {
        const keyType = await this.type(key);
        const p = this.pipeline();
        p.watch(key);
        p.type(key);

        if (this.havePttl) p.pttl(key);
        else p.ttl(key);

        switch (keyType) {
            case 'string':
                p.get(key);
                break;
            case 'list':
                p.lrange(key, 0, -1);
                break;
            case 'set':
                p.smembers(key);
                break;
            case 'zset':
                p.zrange(key, 0, -1);
                break;
            case 'hash':
                p.hgetall(key);
                break;
            default:
                throw new Error(`Unknown type=${keyType}`);
        }

        let [[], [, type], [, ttl], [, value]]: any[][] =
            (await p.exec()) || [];
        if (type != keyType) {
            throw new Error(`Type changed from ${keyType} to ${type}`);
        }

        let expireAt = -1;
        if (this.havePttl && ttl > 0) ttl = ttl / 1000.0;
        if (ttl > 0) expireAt = Date.now() + ttl;

        return { type, key, ttl, expireAt, value };
    }

    async setOne(
        item: IRedisDRS.item,
        useTtl?: boolean,
    ): Promise<string | undefined> {
        let value = item.value;
        const p = <Pipeline & { multi: any }>this.pipeline();
        p.del(item.key);

        switch (item.type) {
            case 'string':
                p.set(item.key, value);
                break;
            case 'list':
                for (const val of value) {
                    p.rpush(item.key, val);
                }
                break;
            case 'set':
                for (const val of value) {
                    p.sadd(item.key, val);
                }
                break;
            case 'zset':
                for (const [score, val] of value.entries()) {
                    p.zadd(item.key, score, val);
                }
                break;
            case 'hash':
                p.hset(item.key, value);
                break;
            default:
                throw new Error(`Unknown type=${item.type}`);
        }

        if (item.ttl > 0) {
            if (useTtl) {
                if (Number.isInteger(item.ttl)) {
                    p.expire(item.key, item.ttl);
                } else {
                    p.pexpire(item.key, +item.ttl * 1000);
                }
            } else {
                if (item.expireAt) {
                    if (Number.isInteger(item.expireAt)) {
                        p.expireat(item.key, item.expireAt);
                    } else {
                        p.pexpireat(item.key, +item.expireAt * 1000);
                    }
                }
            }
        }

        const [error]: any[][] = (await p.exec()) || [];
        return error?.at(0)?.message;
    }

    async *gelAll({
        action = 'GET_ALL',
        pattern = '*',
    }: {
        action?: string;
        pattern?: string;
    }) {
        const keys = await this.keys(pattern);
        yield keys;
        for (const key of keys) {
            try {
                yield await this.getOne(key);
            } catch (error: any) {
                const message = error?.message || error?.stack || error;
                this.logger(
                    `[${action}] error while get [KEY:${key}] [ERROR:${message}]`,
                );
            }
        }
    }

    // @ts-ignore
    async *dump(options: IRedisDRS.dump) {
        const action = 'DUMP';

        await this.init();
        this.logger(`[${action}] redis version: ${this.version}`);

        const { filePath, pattern } = new IRedisDRS.dump(options);
        const stream = writeStream(filePath);

        this.logger(`[${action}] Get all keys for pattern: ${pattern}`);
        const data = this.gelAll({ action, pattern });

        const keys = (await data.next()).value as string[];
        yield keys.length;
        this.logger(`[${action}] Total keys: ${keys.length}`);

        for await (const val of data) {
            await stream.write(val);
            yield val;
        }

        stream.end();

        this.logger(`[${action}] Finished successfully`);
    }

    // @ts-ignore
    async *restore(options: IRedisDRS.restore) {
        const action = 'RESTORE';

        await this.init();
        this.logger(`[${action}] redis version: ${this.version}`);

        const { filePath, useTtl, bulkSize } = new IRedisDRS.restore(options);
        const callback = async (index: number, line: string) => {
            const item = <IRedisDRS.item>JSON.parse(line);
            await this.setOne(item, useTtl);
        };

        const pool: Promise<any>[] = [];
        const { events, reader } = readStream({ filePath, bulkSize, callback });
        let results: (string | number)[] = [];
        let resolve: () => void;
        let promise = new Promise((r) => (resolve = <typeof resolve>r));
        let done = false;

        events
            .on('linesCount', (linesCount) => {
                results.push(linesCount);
                this.logger(`[${action}] Total keys: ${linesCount}`);
            })
            .on('line', (index, line) => {
                results.push(line);
                resolve();
                promise = new Promise((r) => (resolve = <typeof resolve>r));
            })
            .on('error', (error) => {
                done = true;
                this.logger(`[${action}] Failed with error: ${error}`);
            })
            .on('end', async () => {
                await Promise.allSettled(pool);
                done = true;
                resolve();
                this.logger(`[${action}] Finished successfully`);
            });

        pool.push(reader());

        while (!done) {
            await promise;
            yield* results;
            results = [];
        }
    }

    // @ts-ignore
    async *sync(options: IRedisDRS.sync) {
        const action = 'SYNC';

        await this.init();
        this.logger(`[${action}] redis version: ${this.version}`);

        const { targetRedisOptions, pattern, useTtl } = new IRedisDRS.sync(
            options,
        );

        const targetRedis = new RedisDRS(targetRedisOptions);

        this.logger(`[${action}] Get all keys for pattern: ${pattern}`);
        const data = this.gelAll({ action, pattern });
        const keys = (await data.next()).value as string[];
        yield keys.length;
        this.logger(`[${action}] Total keys: ${keys.length}`);

        for await (const item of data) {
            await targetRedis.setOne(<IRedisDRS.item>item, useTtl);
            yield item;
        }

        this.logger(`[${action}] Finished successfully`);

        targetRedis.disconnect();
    }
}
