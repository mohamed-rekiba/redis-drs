#!/usr/bin/env node

let { spawn } = require('child_process');
let { build } = require('esbuild');

let server;
let isDev = process.argv[2] === '--watch';
const assets = [];

let onRebuild = () => {
    if (isDev) {
        if (server) server.kill('SIGINT');
        server = spawn('node', ['bundle/index.js'], { stdio: 'inherit' });
    }
};

build({
    entryPoints: ['src/index.ts'],
    outfile: 'bundle/index.js',
    platform: 'node',
    bundle: true,
    sourcemap: true,
    minify: !isDev,
}).finally(onRebuild);

build({
    entryPoints: ['src/bin/cli.ts'],
    outfile: 'bundle/bin/cli.js',
    platform: 'node',
    bundle: true,
    sourcemap: true,
    minify: !isDev,
    define: {
        'process.env.NODE_ENV': 'production',
    },
});
