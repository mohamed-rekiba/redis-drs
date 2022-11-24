#!/usr/bin/env node
import { dump, restore, sync } from './utils';
import { argv, command } from './argv';
import * as IRedisDRS from './model';

(async () => {
    const { filePath, uri, sourceUri, targetUri, pattern, useTtl, bulkSize } =
        argv;

    switch (command) {
        case 'dump':
            dump(<IRedisDRS.dump>{ filePath, uri, pattern, bulkSize });
            break;
        case 'restore':
            restore(<IRedisDRS.restore>{ filePath, uri, bulkSize, useTtl });
            break;
        case 'sync':
            sync(<IRedisDRS.sync>{
                sourceUri,
                targetUri,
                pattern,
                bulkSize,
                useTtl,
            });
            break;
        default:
            break;
    }
})();
