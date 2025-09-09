const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8000;
const host = '0.0.0.0';

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    
    // Default to index.html if requesting root
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    // Log the request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                console.log(`404 - File not found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                            <h1>404 - File Not Found</h1>
                            <p>The requested file <strong>${req.url}</strong> was not found.</p>
                            <a href="/">Go to Home</a>
                        </body>
                    </html>
                `, 'utf-8');
            } else {
                // Server error
                console.log(`500 - Server error: ${error.code}`);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, host, () => {
    console.log(`🚀 Options Strategy Generator Server running at http://${host}:${port}/`);
    console.log(`📊 Serving files from: ${process.cwd()}`);
    console.log(`⚡ Ready to serve real-time options strategies!`);
});

// Handle server errors
server.on('error', (error) => {
    console.error(`❌ Server error: ${error.message}`);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});