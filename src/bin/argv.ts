import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

export const commands: string[] = ['dump', 'restore', 'sync'];

const _yargs = yargs(hideBin(process.argv))
    .command(
        'dump',
        'Dump data from redis index to dump file, using custom pattern.',
        {
            f: {
                alias: 'filePath',
                description: 'Dump file full path, for example `~/dump.csv`.',
                demandOption: true,
            },
            u: {
                alias: 'uri',
                description:
                    'Redis uri with db index, for example `redis://localhost:6379/0`.',
                demandOption: true,
            },
            p: {
                alias: 'pattern',
                default: '*',
                description:
                    'Redis key pattern, for example `username:*` and `*` means all keys.',
            },
            b: {
                alias: 'bulkSize',
                default: 1000,
                description: 'Count of item to get in parallel.',
            },
        },
    )
    .command('restore', 'Restore from csv dump file.', {
        f: {
            alias: 'filePath',
            description: 'Dump file full path, for example `~/dump.csv`.',
            demandOption: true,
        },
        u: {
            alias: 'uri',
            description:
                'Redis uri with db index, for example `redis://localhost:6379/0`.',
            demandOption: true,
        },
        t: {
            alias: 'useTtl',
            default: true,
            description: 'Use Redis ttl instead of expiration time.',
        },
        b: {
            alias: 'bulkSize',
            default: 1000,
            description: 'Count of item to insert in parallel.',
        },
    })
    .command('sync', 'Sync between two redis, using custom pattern.', {
        su: {
            alias: 'sourceUri',
            description:
                'Source Redis uri with db index, for example `redis://localhost:6379/0`.',
            demandOption: true,
        },
        tu: {
            alias: 'targetUri',
            description:
                'Target Redis uri with db index, for example `redis://localhost:6380/0`.',
            demandOption: true,
        },
        p: {
            alias: 'pattern',
            default: '*',
            description:
                'Redis key pattern, for example `username:*` and `*` means all keys.',
        },
        b: {
            alias: 'bulkSize',
            default: 1000,
            description: 'Count of item to sync in parallel.',
        },
        t: {
            alias: 'useTtl',
            default: true,
            description: 'Use Redis ttl instead of expiration time.',
        },
    })
    .demandCommand(1, 'You have to pass one command with related arguments!')
    .check((argv) => {
        const _commands = <string[]>argv._;
        const command = <string>_commands?.at(0);
        if (_commands.length > 1) {
            throw new Error(
                `Only one command may be passed: ${_commands.join(', ')}.`,
            );
        } else if (!commands.includes(command)) {
            throw new Error(`Unknown command: ${command}`);
        } else {
            return true;
        }
    })
    .usage('$0 <command> <arguments>')
    .help();

export const argv = _yargs.parseSync();
export const command = <string>argv?._?.at(0);
export const showHelp = _yargs.showHelp;
