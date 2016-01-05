#!/usr/bin/env babel-node

"use strict";

let fs = require('pn/fs')
let path = require('path')
let _ = require('lodash')

var rootPath = process.argv[2]

async function rm(rootPath)
{
     try 
     {
        let lspromises = []
        let data = await fs.stat(rootPath)
        if(data.isFile()){

            let data = await fs.unlink(rootPath)
        }
        else{
        	 let fileNames =await fs.readdir(rootPath)
             for (let fileName of fileNames) 
             {
                let filePath = path.join(rootPath, fileName)
                await rm(filePath)
            }
              fs.rmdir(rootPath).then(console.log("removing directory "+rootPath))
        }
    } catch (e) {
        console.log(e.stack)
    }
}

rm(rootPath)