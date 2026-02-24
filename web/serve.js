// Aither Web — minimal static file server.

import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
};

const port = parseInt(process.env.PORT) || 3000;
const snippetsDir = join(import.meta.dir, 'snippets');

// Sync index.json with snippets directory on startup
const files = await readdir(snippetsDir);
const names = files.filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).sort();
await writeFile(join(snippetsDir, 'index.json'), JSON.stringify(names));

Bun.serve({
    port,
    async fetch(req) {
        const url = new URL(req.url);

        // API: list snippet names
        if (url.pathname === '/api/snippets') {
            const files = await readdir(snippetsDir);
            const names = files
                .filter(f => f.endsWith('.js'))
                .map(f => f.slice(0, -3))
                .sort();
            return Response.json(names);
        }

        const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
        const file = Bun.file('.' + pathname);
        if (!(await file.exists())) return new Response('Not found', { status: 404 });
        const ext = pathname.slice(pathname.lastIndexOf('.'));
        return new Response(file, {
            headers: { 'Content-Type': MIME[ext] || 'application/octet-stream' },
        });
    },
});

console.log(`[Aither] Web server at http://localhost:${port}`);
