import { RedisOptions } from 'ioredis';

export interface options {
    path?: string;
    port?: number;
    host?: string;
    options?: RedisOptions;
    logger?: boolean;
}

export type keyType = 'string' | 'list' | 'set' | 'zset' | 'hash';

export interface item {
    type: keyType;
    key: string;
    ttl?: any;
    expireAt?: number;
    value: any;
}

export class dump {
    filePath: string;
    pattern?: string = '*';

    constructor(options: dump) {
        this.filePath = options.filePath;
        this.pattern = options.pattern || this.pattern;
    }
}

export class restore {
    filePath: string;
    useTtl?: boolean;
    bulkSize?: number = 1000;

    constructor(options: restore) {
        this.filePath = options.filePath;
        this.useTtl = options.useTtl;
        this.bulkSize = options.bulkSize || this.bulkSize;
    }
}

export class sync {
    targetRedisOptions: options;
    pattern?: string = '*';
    useTtl?: boolean;

    constructor(options: sync) {
        this.targetRedisOptions = options.targetRedisOptions;
        this.pattern = options.pattern || this.pattern;
        this.useTtl = options.useTtl;
    }
}

export interface IReadStream {
    filePath: string;
    bulkSize?: number;
    callback: (index: number, line: string) => Promise<void>;
}
