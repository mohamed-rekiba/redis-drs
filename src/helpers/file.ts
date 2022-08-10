import { resolve } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { mapSync, split } from 'event-stream';
import EventEmitter from 'events';
import { IReadStream } from '../model';

const logeError = (func: string, data: string, reason: string) => {
    console.error(
        `[RedisDRS] Error while run ${func} callback: data > ${data}`,
    );
    console.error(
        `[RedisDRS] Error while run ${func} callback: message > ${reason}`,
    );
};

export function writeStream(filePath: string) {
    const stream = createWriteStream(resolve(filePath));

    return {
        write: (data: any): Promise<void> => {
            if (typeof data === 'object') data = JSON.stringify(data);

            if (!stream.write(data + '\r\n')) {
                return new Promise((res, rej) => {
                    stream.once('drain', () => res());
                });
            } else {
                return Promise.resolve();
            }
        },
        end: () => stream.end(),
    };
}

export function readStream({
    filePath,
    bulkSize = 1000,
    callback,
}: IReadStream): {
    events: EventEmitter;
    reader: () => Promise<void>;
} {
    const events = new EventEmitter();
    const reader = () => {
        return new Promise<void>(async (res, rej) => {
            const _filePath = resolve(filePath);
            let linesCount = await countLines(_filePath);
            events.emit('linesCount', linesCount);

            let index = 0;
            let pool: Promise<void>[] = [];

            const stream = createReadStream(_filePath)
                .pipe(split())
                .pipe(
                    mapSync(async (line: string) => {
                        const tempIndex = ++index;
                        line = line?.trim();

                        // Skip empty lines
                        if (!line) return;

                        events.emit('line', index, line);

                        pool.push(
                            callback(tempIndex, line).catch((error) =>
                                logeError('readStream', line, error?.message),
                            ),
                        );

                        if (!linesCount && tempIndex % bulkSize == 0) {
                            stream.pause();
                            await Promise.allSettled(pool);
                            pool = [];
                            stream.resume();
                        }

                        if (linesCount && linesCount - tempIndex < 10) {
                            stream.pause();
                            if (pool.length) {
                                await Promise.allSettled(pool);
                                pool = [];
                            }

                            await callback(tempIndex, line);
                            stream.resume();
                        }
                    }),
                );

            stream.on('error', (error) => {
                events.emit('error', error);
                events.removeAllListeners();
                rej(error);
            });

            stream.on('end', async () => {
                events.emit('end', true);
                events.removeAllListeners();
                res();
            });
        });
    };

    return { events, reader };
}

export const countLines = (filePath): Promise<number> => {
    return new Promise((res, rej) => {
        let linesCount = 0;

        createReadStream(filePath)
            .pipe(split())
            .on('data', (line) => line?.trim() && ++linesCount)
            .on('end', () => res(linesCount))
            .on('error', rej);
    });
};
