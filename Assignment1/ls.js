#!/usr/bin/env babel-node

"use strict";

let fs = require('pn/fs')
let path = require('path')
let lodash = require('lodash')


var rootPath = process.argv[2]
var param
var recursive = false
//console.log(process.argv.length)
if (process.argv.length < 3) {
        rootPath = './'
}
else {

    if (process.argv[2] == '-R') {
        recursive = true
        if (process.argv.length < 4) {
            rootPath = './'
        }
        else {
            rootPath = process.argv[3];
        }
	}
    else {
        recursive = false
        rootPath = process.argv[2];
    }
}

//console.log(rootPath)
//console.log(recursive)

function ls(rootPath, recursive)
{
     try 
     {
     	let lspromises = []

     	if(fs.statSync(rootPath).isFile())
 		{
 			console.log(rootPath);
 		}
        if (recursive){
         	fs.readdir(rootPath).then(function(fileNames)
         	{

                for (let fileName of fileNames) {
    	     	 	let filePath = path.join(rootPath, fileName)
                    let promise = ls(filePath, recursive)
                    console.log(filePath)
                }

         	})
        	
        	
            
        }
        else {

            fs.readdir(rootPath).then(function(fileNames)
            {
                for (let fileName of fileNames) {
                    lspromises.push(path.join(rootPath, fileName))
                    console.log(path.join(rootPath, fileName))
                }
            })
        }
        
    } catch (e) {
        console.log(e.stack)
    }
}


ls(rootPath, recursive)

