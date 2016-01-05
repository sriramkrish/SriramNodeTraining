// All require calls go at the top of index.js
let http = require('http')
let request = require('request')

// Set a the default value for --host to 127.0.0.1
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let scheme = 'http://'

console.log('argv =', argv)
// Get the --port value
// If none, default to the echo server port, or 80 if --host exists
let port = argv.port || (argv.host == '127.0.0.1' ? 8000 : 80)

// Update our destinationUrl line from above to include the port
let destinationUrl = argv.url || scheme + argv.host + ':' + port

console.log('destinationUrl =', destinationUrl)

let path = require('path')
let fs = require('fs')
let logPath = argv.log && path.join(__dirname, argv.log)
console.log('logpath =', logPath)
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout

http.createServer((req, res) => {
  console.log(`Proxying request to: ${destinationUrl + req.url}`)
  // Proxy code here
  let options = {
        headers: req.headers,
        url: `${destinationUrl}${req.url}`
    }
    options.method = req.method
    // Notice streams are chainable:
	// inpuStream -> input/outputStream -> outputStream
    let downstreamResponse = req.pipe(request(options))
    process.stdout.write(JSON.stringify(downstreamResponse.headers))

    downstreamResponse.pipe(process.stdout)
    downstreamResponse.pipe(res)

}).listen(8001)

http.createServer((req, res) => {
    console.log(`Request received at: ${req.url}`)
    
    // Log the req headers and content in the **server callback**
	process.stdout.write('\n\n\n' + JSON.stringify(req.headers))
	req.pipe(logStream, {end: false})
	logStream.write('Request headers: ' + JSON.stringify(req.headers))

    req.pipe(res)


}).listen(8000)
