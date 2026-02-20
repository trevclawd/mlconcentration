const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8893;
const ROOT_DIR = __dirname;
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const pathname = req.url.split('?')[0];
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // API endpoint for OpenAI key
    if (pathname === '/api/openai-key') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ key: OPENAI_KEY }));
        return;
    }
    
    let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`ML Concentration server running at http://0.0.0.0:${PORT}/`);
    console.log(`Serving files from: ${ROOT_DIR}`);
});
