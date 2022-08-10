# redis-drs - A Redis Dump, Restore and Sync Tool

> Inspired by [pyredis-dump](https://github.com/muayyad-alsadi/pyredis-dump)

> Build on top of [ioredis](https://www.npmjs.com/package/ioredis), so it's offer all ioredis features

## Features

-   Supports all Redis data types;
-   Dump/Restore/Sync TTL and expiration times;
-   Dumps are human readable
-   Dumps are line-aligned (can be streamed)
-   Can load TTL OR original expiration time for expiring keys;
-   Can be used as a module in a larger program or as a standalone utility

## Usage

### CLI Basic Example

```shell
npm i -g redis-drs

redis-drs dump --filePath dump.csv --uri redis://localhost:6379/0 --pattern 'username:*'
redis-drs restore --filePath dump.csv --uri redis://localhost:6380/0
redis-drs sync --sourceUri redis://localhost:6379/0 --targetUri redis://localhost:6380/0

# For help
redis-drs dump --help
```

### Package Basic Example

```shell
npm i -S redis-drs
```

#### Dump

```typescript
import { RedisDRS } from 'redis-drs';

const redis = new RedisDRS({ path: 'redis://localhost:6379/0' });
const data = redis.dump({ filePath: 'dump.csv', pattern: 'username:*' });

// Total keys is always the first item in the iterator
const total = (await data.next()).value as number;
console.log(`Total keys: ${total}`);

for await (const val of data) {
    // Here you can reach data stream copy
}

redis.disconnect();
```

#### Restore

```typescript
import { RedisDRS } from 'redis-drs';

const redis = new RedisDRS({ path: 'redis://localhost:6379/0' });
const data = await redis.restore({
    filePath: 'dump.csv',
    useTtl: true,
    bulkSize: 1000,
});

// Total keys is always the first item in the iterator
const total = (await data.next()).value as number;
console.log(`Total keys: ${total}`);

for await (const val of data) {
    // Here you can reach data stream copy
}

redis.disconnect();
```

#### Sync

```typescript
import { RedisDRS } from 'redis-drs';

const redis = new RedisDRS({ path: 'redis://localhost:6379/0' });
const data = await redis.sync({
    targetRedisOptions: { path: 'redis://localhost:6380/0' },
    pattern: 'username:*',
    useTtl: true,
});

// Total keys is always the first item in the iterator
const total = (await data.next()).value as number;
console.log(`Total keys: ${total}`);

for await (const val of data) {
    // Here you can reach data stream copy
}

redis.disconnect();
```
