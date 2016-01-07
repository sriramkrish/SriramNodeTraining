let express = require('express')
require('songbird')
let morgan = require('morgan')

let nodeify = require('bluebird-nodeify')

let trycatch = require('trycatch')
let main = require('./main')
let path=require('path')
let fs = require('fs')
let rimraf = require('rimraf')

let mime = require('mime-types')

let mkdirp = require('mkdirp')

//let bluebird = require('bluebird')
//bluebird.longStackTraces()

//require('longjohn')

let nssocket = require('nssocket')
let chokidar = require('chokidar')


const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const TCP_PORT = 8001
const ROOT_DIR = path.resolve(process.cwd())

let app = express()

if (NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

// These will help us with troubleshooting
trycatch.configure({'long-stack-traces': true})

process.on('uncaughtException', 
    function(err) {
        console.log('uncaughtException: \n\n', err.stack)
        // IMPORTANT: Exit the process (optionally, soft exit)
        process.exit()
    })

process.on('unhandledRejection', 
    function(err) {
        console.log('unhandledRejection: \n\n', err.stack)
        // IMPORTANT: Exit the process (optionally, soft exit)
        process.exit()
    })

app.listen(PORT)
console.log(`LISTENING @ http://127.0.0.1:${PORT}`)
var sockets = [];
var server = nssocket.createServer(
    function (socket) {
        console.log('inside socket')
        sockets.push(socket);
        socket.data('Connecting', function (data) {
            console.log("There are now", sockets.length);

            for(var i=0, l=sockets.length; i<l; i++) {
                sockets[i].send('Broadcasting',{ iam: true, indeedHere: true });
            }
        });
    }
    ).listen(TCP_PORT);
console.log(`LISTENING ${TCP_PORT} for Dropbox Clients`)

let watcher = chokidar.watch('.', {ignored: /[\/\\]\./,ignoreInitial: true})
// Add event listeners. 
watcher
  .on('add', path => broadcast2Client('write', false, path))
  .on('change', path => broadcast2Client('write', false, path))
  .on('unlink', path => broadcast2Client('delete', false, path));

app.get('*', setFileMeta, sendHeaders, (req, res) => {
    console.log('here')
    if (res.body) {
        console.log('in res.body')
        res.json(res.body)
        res.end()
        return
    }
    
    fs.createReadStream(req.filePath).pipe(res)
    
} )

app.head('*', setFileMeta, sendHeaders, (req, res) => res.end())

app.delete('*', setFileMeta, setDirDetails, (req, res, next) => {
    async ()=>{
        if (!req.stat) {
            console.log('############')
            res.send(400, 'File does not exist')
            return
        }
        if (req.isDir) {
            await rimraf.promise(req.filePath)
        }
        else {
            await fs.promise.unlink(req.filePath)
        }
        //broadcast2Client('delete', req.url, req.isDir)
        res.end()
    }().catch(next)

})

app.put('*', setFileMeta, setDirDetails, (req, res, next) => {
    async ()=>{
        if (req.stat) {
            res.send(405, 'Duplicate File or Directory \n')
            return
        }        
        await mkdirp.promise(req.dirPath)
        if (!req.isDir){
            req.pipe(fs.createWriteStream(req.filePath))
        }
        //broadcast2Client('write', req.url, req.isDir)
        res.end()
    }().catch(next)
})

app.post('*', setFileMeta, setDirDetails, (req, res, next) => {
    async ()=>{
        if (!req.stat) {
            res.send(405, 'File does not exist \n')
            return
        }
        if (req.isDir) {
            res.send(405, 'Cannot Update Directory \n')
            return
        }
        else {  
            await fs.promise.truncate(req.filePath)
            req.pipe(fs.createWriteStream(req.filePath))
            //broadcast2Client('write', req.url, req.isDir)
        }
        res.end()
    }().catch(next)
})

function broadcast2Client(action, dir, path) {
    console.log('before writing to the socket1')
    
    let jsonString = '{ "action": "' + action 
    jsonString = jsonString + '","path":"' + path
    jsonString = jsonString +  '","type": "' + dir
    jsonString = jsonString + '"}'

    for(var i=0, l=sockets.length; i<l; i++) {
        sockets[i].send('Broadcasting', jsonString);
    }

}

function setDirDetails(req, res, next) {
    let endsWithSlash = req.filePath.charAt(req.filePath.length-1) === path.sep
    let hasExtension = path.extname(req.filePath) !== ''

    req.isDir = endsWithSlash || !hasExtension
    req.dirPath = req.isDir ? req.filePath : path.dirname(req.filePath)
    next()
}

function setFileMeta(req, res, next) {
    console.log('requrl=',req.url)
    req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
    if (req.filePath.indexOf(ROOT_DIR) !== 0) {
        res.send(400, 'Invalid Path \n')
        return
    }
    fs.promise.stat(req.filePath)
        .then(stat => req.stat = stat, () => req.stat = null)
        .nodeify(next)
}

function sendHeaders(req, res, next) {
    console.log('in sendHeaders')
    nodeify(async ()=> {
        if (req.stat && req.stat.isDirectory()) {
            console.log('inside Dir path')
            let files = await fs.promise.readdir(req.filePath)
            res.body = JSON.stringify(files)
            res.setHeader('Content-Length', res.body.length)
            res.setHeader('Content-Type', 'application/json')
            console.log('coming out of Dir path')
            return
        }
        
        res.setHeader('Content-Length', req.stat.size)
        let contentType = mime.contentType(path.extname(req.filePath))
        res.setHeader('Content-Type', contentType)


    }(), next)
}





