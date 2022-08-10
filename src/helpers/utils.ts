export interface IEmitter {
    emit: (v: any) => void;
    throw: (e: any) => void;
    [Symbol.asyncIterator]: () => {
        next: () => Promise<{
            value: any;
            done: boolean;
        }>;
        throw: (e: any) => void;
    };
}

export function createEmitter() {
    const queue: any[] = [];
    let resolve;

    const push = (p) => {
        queue.push(p);
        if (resolve) {
            resolve();
            resolve = null;
        }
    };

    const emitError: any = (e) => push(Promise.reject(e));

    return {
        emit: (v) => push(Promise.resolve(v)),
        throw: emitError,

        [Symbol.asyncIterator]: () => ({
            next: async () => {
                while (!queue.length) {
                    await new Promise((...a) => ([resolve] = a));
                }
                return { value: await queue.pop(), done: false };
            },
            throw: emitError,
        }),
    };
}
