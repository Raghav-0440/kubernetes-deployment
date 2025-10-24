const http = require('http');
const port = process.env.PORT || 8080;
const version = process.env.APP_VERSION || 'v1';

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type':'text/plain'});
  res.end(`Hello from Blue-Green Deployment (${version})\n`);
}).listen(port, () => console.log('listening', port));
