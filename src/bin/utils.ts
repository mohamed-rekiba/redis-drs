import ProgressBar from 'progress';
import { RedisDRS } from '../index';
import * as IRedisDRS from './model';

export const progressBar = (type: string, total: number) => {
    return new ProgressBar(`[${type}] Progress [:bar] :rate/s :percent :etas`, {
        complete: '=',
        incomplete: ' ',
        width: 50,
        total,
    });
};

export const dump = async (options: IRedisDRS.dump) => {
    const {
        filePath,
        uri: path,
        pattern,
        bulkSize,
        logger,
    } = new IRedisDRS.dump(options);
    const redis = new RedisDRS({ path, logger });
    const data = await redis.dump({ filePath, pattern, bulkSize });
    const total = (await data.next()).value as any;
    const progress = progressBar('DUMP', total);

    for await (const _val of data) progress?.tick();

    redis.disconnect();
};

export const restore = async (options: IRedisDRS.restore) => {
    const {
        filePath,
        uri: path,
        useTtl,
        bulkSize,
        logger,
    } = new IRedisDRS.restore(options);
    const redis = new RedisDRS({ path, logger });
    const data = await redis.restore({ filePath, useTtl, bulkSize });
    const total = (await data.next()).value as number;
    const progress = progressBar('RESTORE', total);

    for await (const _val of data) progress?.tick();

    redis.disconnect();
};

export const sync = async (options: IRedisDRS.sync) => {
    const { sourceUri, targetUri, pattern, bulkSize, useTtl, logger } =
        new IRedisDRS.sync(options);

    const redis = new RedisDRS({ path: sourceUri, logger });
    const data = await redis.sync({
        targetRedisOptions: { path: targetUri, logger },
        pattern,
        bulkSize,
        useTtl,
    });
    const total = (await data.next()).value as any;
    const progress = progressBar('SYNC', total);

    for await (const _val of data) progress?.tick();

    redis.disconnect();
};
