import net, { AddressInfo } from 'net';
import { exec } from 'child_process';
import { exit } from 'process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface IContainer {
    name: string;
    port: number;
}

const getFreePort = (): Promise<number> => {
    return new Promise((res) => {
        const srv = net.createServer();
        srv.listen(0, () => {
            const port = (<AddressInfo>srv?.address())?.port;
            srv.close((err) => res(port));
        });
    });
};

const generateRandomString = (): string => {
    return (Math.random() + 1).toString(36).substring(7);
};

export const startContainer = async (): Promise<IContainer> => {
    const name = 'redis-' + generateRandomString();
    const port = await getFreePort();
    const cmd = `docker run -it --rm -d -p ${port}:6379 --name ${name} redis:6-alpine`;

    try {
        await execAsync(cmd);
    } catch (err: any) {
        console.error('Error: ' + err.message);
        exit(1);
    }

    return { name, port };
};

export const deleteContainer = async (name: string): Promise<void> => {
    const cmd = `docker container rm -f ${name}`;

    try {
        await execAsync(cmd);
    } catch (err: any) {
        console.error('Error: ' + err.message);
        exit(1);
    }
};
