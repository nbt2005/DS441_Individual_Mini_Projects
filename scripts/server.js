const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const routes = { '/': ['frontend/index.html','text/html; charset=utf-8'], '/app.js': ['frontend/app.js','text/javascript; charset=utf-8'], '/style.css': ['frontend/style.css','text/css'], '/deployment.json': ['frontend/deployment.json','application/json'], '/ethers.js': ['node_modules/ethers/dist/ethers.umd.min.js','text/javascript'] };
http.createServer((req, res) => {
  const route = routes[new URL(req.url, 'http://localhost').pathname];
  if (!route) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(root, route[0]), (error, data) => {
    res.writeHead(error ? 404 : 200, {'Content-Type': route[1], 'Cache-Control': 'no-store'});
    res.end(error ? 'File missing. Run npm run deploy first.' : data);
  });
}).listen(5173, '127.0.0.1', () => console.log('Open http://127.0.0.1:5173'));
