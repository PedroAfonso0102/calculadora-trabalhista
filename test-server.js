const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);

    // Endpoint for receiving test results
    if (req.method === 'POST' && req.url === '/test-results') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('Received test results body:', body);
            fs.writeFile('test-results.json', body, (err) => {
                if (err) {
                    console.error('Error writing test results file:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Error saving test results' }));
                    return;
                }
                console.log('Successfully wrote to test-results.json');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Test results received' }));
            });
        });
        return;
    }

    // Static file serving logic
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './tests.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                console.log(`File not found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 Not Found', 'utf-8');
            } else {
                console.log(`Server error: ${error.code}`);
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 4568;
server.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
});
