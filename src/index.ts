import Redis, { Pipeline } from 'ioredis';
import EventEmitter from 'events';
import { readStream, writeStream } from './helpers/file';
import * as IRedisDRS from './model';

EventEmitter.defaultMaxListeners = 0;

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
        item: IRedisDRS.item | Promise<IRedisDRS.item>,
        useTtl?: boolean,
    ): Promise<string | undefined> {
        item = await item;
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

    async gelAll({
        action = 'GET_ALL',
        pattern = '*',
        bulkSize = 1000,
    }: {
        action?: string;
        pattern?: string;
        bulkSize?: number;
    }) {
        const emitter = new EventEmitter();

        const getData = async () => {
            let keys = await this.keys(pattern);
            emitter.emit('keys', keys);
            let pool: Promise<IRedisDRS.item>[] = [];

            for (const key of keys) {
                try {
                    const data = this.getOne(key);
                    emitter.emit('data', data);
                    pool.push(data);

                    if (pool.length >= bulkSize) {
                        await Promise.all(pool);
                        pool = [];
                    }
                } catch (error: any) {
                    const message = error?.message || error?.stack || error;
                    emitter.emit('error', message);
                    emitter.removeAllListeners();
                    this.logger(
                        `[${action}] error while get [KEY:${key}] [ERROR:${message}]`,
                    );
                }
            }

            await Promise.all(pool);
            emitter.emit('end');
        };

        return { getData, emitter };
    }

    // @ts-ignore
    async *dump(options: IRedisDRS.dump) {
        const action = 'DUMP';

        await this.init();
        this.logger(`[${action}] redis version: ${this.version}`);

        const { filePath, pattern, bulkSize } = new IRedisDRS.dump(options);
        const stream = writeStream(filePath);

        this.logger(`[${action}] Get all keys for pattern: ${pattern}`);

        const { getData, emitter } = await this.gelAll({
            action,
            pattern,
            bulkSize,
        });
        const pool: Promise<void>[] = [];
        let dataPool: Promise<number | IRedisDRS.item | void>[] = [];
        let streamPool: Promise<void>[] = [];
        let resolve: () => void;
        let promise = new Promise((r) => (resolve = <typeof resolve>r));
        let done = false;

        emitter
            .on('keys', (keys) => {
                dataPool.push(keys.length);
                this.logger(`[${action}] Total keys: ${keys.length}`);
            })
            .on('data', async (data) => {
                dataPool.push(data);
                streamPool.push(stream.write(data));
                resolve();
                promise = new Promise((r) => (resolve = <typeof resolve>r));
            })
            .on('error', (error) => {
                done = true;
                this.logger(`[${action}] Failed with error: ${error}`);
            })
            .on('end', async () => {
                await Promise.allSettled(streamPool);
                await Promise.allSettled(pool);
                done = true;
                resolve();
                stream.end();
                this.logger(`[${action}] Finished successfully`);
            });

        pool.push(getData());

        while (!done) {
            await promise;
            yield* dataPool;
            dataPool = [];
        }
    }

    // @ts-ignore
    async *restore(options: IRedisDRS.restore) {
        const action = 'RESTORE';

        await this.init();
        this.logger(`[${action}] redis version: ${this.version}`);

        const { filePath, useTtl, bulkSize } = new IRedisDRS.restore(options);
        const callback = async (index: number, line: string) => {
            const item = <IRedisDRS.item>JSON.parse(line);
            try {
                await this.setOne(item, useTtl);
            } catch (error: any) {
                const message = error?.message || error?.stack || error;
                emitter.emit('error', message);
                emitter.removeAllListeners();
                this.logger(
                    `[${action}] error while set [LINE:${line}] [ERROR:${message}]`,
                );
            }
        };

        const pool: Promise<any>[] = [];
        const { emitter, reader } = readStream({
            filePath,
            bulkSize,
            callback,
        });
        let results: (string | number)[] = [];
        let resolve: () => void;
        let promise = new Promise((r) => (resolve = <typeof resolve>r));
        let done = false;

        emitter
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

        const { targetRedisOptions, pattern, bulkSize, useTtl } =
            new IRedisDRS.sync(options);

        const targetRedis = new RedisDRS(targetRedisOptions);

        this.logger(`[${action}] Get all keys for pattern: ${pattern}`);

        const { getData, emitter } = await this.gelAll({
            action,
            pattern,
            bulkSize,
        });
        const pool: Promise<void>[] = [];
        let dataPool: Promise<number | IRedisDRS.item | void>[] = [];
        let syncPool: Promise<any>[] = [];
        let resolve: () => void;
        let promise = new Promise((r) => (resolve = <typeof resolve>r));
        let done = false;

        emitter
            .on('keys', (keys) => {
                dataPool.push(keys.length);
                this.logger(`[${action}] Total keys: ${keys.length}`);
            })
            .on('data', async (data) => {
                dataPool.push(data);
                syncPool.push(
                    targetRedis
                        .setOne(<IRedisDRS.item>data, useTtl)
                        .catch(async (error) => {
                            data = JSON.stringify(await data);
                            const message =
                                error?.message || error?.stack || error;
                            emitter.emit('error', message);
                            emitter.removeAllListeners();
                            this.logger(
                                `[${action}] error while set [DATA:${data}] [ERROR:${message}]`,
                            );
                        }),
                );
                resolve();
                promise = new Promise((r) => (resolve = <typeof resolve>r));
            })
            .on('error', (error) => {
                done = true;
                this.logger(`[${action}] Failed with error: ${error}`);
            })
            .on('end', async () => {
                await Promise.allSettled(syncPool);
                await Promise.allSettled(pool);
                done = true;
                resolve();
                targetRedis.disconnect();

                this.logger(`[${action}] Finished successfully`);
            });

        pool.push(getData());

        while (!done) {
            await promise;
            yield* dataPool;
            dataPool = [];
        }
    }
}
