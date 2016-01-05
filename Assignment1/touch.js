#!/usr/bin/env node

var fs = require('pn/fs')

if (process.argv.length > 2) {
	var filename = process.argv[2];
	fs.exists(filename).then(
		fs.utimes(filename,new Date(),new Date())
		).catch(

		fs.open(filename,"w")
		)
};