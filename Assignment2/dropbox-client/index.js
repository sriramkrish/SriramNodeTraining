let path=require('path')
let fs = require('fs')
require('songbird')

let request = require('request')


let nssocket = require('nssocket')

var outbound = new nssocket.NsSocket();
outbound.connect(8001);

console.log("connected to 8001")

outbound.data('Broadcasting',function (data) {
	var json = JSON.parse(data)
	var path = json['path']
	var action = json['action']

	if (action === 'delete') {
		console.log(path,' to be deleted')
		fs.promise.unlink(path)
			.then(stat => console.log(path, ' deleted'))
	}
	else {
		console.log(path,' to be downloaded and copied')
		

		var requestParam = {
	         url: 'http://localhost:8000/' + path,
	         method:'GET'
		}

		request(requestParam, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var writeStream = fs.createWriteStream(path);
				writeStream.once('open', function(fd) {
			  		writeStream.write(body)
			  		writeStream.end()
				})
				console.log(path,' written')
			}
		})

	}
})

