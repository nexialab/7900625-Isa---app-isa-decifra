const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8080;
const DIST = path.join(__dirname, 'dist');
const mime = {
  '.html':'text/html','.js':'application/javascript','.css':'text/css',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif',
  '.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json',
  '.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'
};
const server = http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }
  const ext = path.extname(filePath);
  const ct = mime[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(500); res.end('Error'); }
    else { res.writeHead(200, { 'Content-Type': ct }); res.end(content); }
  });
});
server.listen(PORT, () => console.log('Serving dist on http://localhost:' + PORT));
