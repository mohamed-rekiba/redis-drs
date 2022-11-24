export class dump {
    uri: string;
    filePath: string;
    pattern?: string = '*';
    bulkSize?: number = 1000;
    logger?: boolean = true;

    constructor(options: dump) {
        this.uri = options.uri;
        this.filePath = options.filePath;
        this.pattern = options.pattern || this.pattern;
        this.bulkSize = options.bulkSize || this.bulkSize;
        this.logger = options.logger || this.logger;
    }
}

export class restore {
    uri: string;
    filePath: string;
    useTtl?: boolean = true;
    bulkSize?: number = 1000;
    logger?: boolean = true;

    constructor(options: restore) {
        this.uri = options.uri;
        this.filePath = options.filePath;
        this.useTtl = options.useTtl || this.useTtl;
        this.bulkSize = options.bulkSize || this.bulkSize;
        this.logger = options.logger || this.logger;
    }
}

export class sync {
    sourceUri: string;
    targetUri: string;
    pattern?: string = '*';
    bulkSize?: number = 1000;
    useTtl?: boolean = true;
    logger?: boolean = true;

    constructor(options: sync) {
        this.sourceUri = options.sourceUri;
        this.targetUri = options.targetUri;
        this.pattern = options.pattern || this.pattern;
        this.bulkSize = options.bulkSize || this.bulkSize;
        this.useTtl = options.useTtl || this.useTtl;
        this.logger = options.logger || this.logger;
    }
}
