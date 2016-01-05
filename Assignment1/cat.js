#!/usr/bin/env node

"use strict";

let fs = require('pn/fs')

if (process.argv.length > 2) {
	fs.readFile(process.argv[2]).then(
		function (data) { 
			process.stdout.write( data+"\n")
		})
}