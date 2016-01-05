#!/usr/bin/env node

arguments = process.argv
noOfArgs = arguments.length

if (noOfArgs > 2) {
	for (i=2;i<noOfArgs;i++){
		process.stdout.write(arguments[i])
		process.stdout.write(' ')
	}
	process.stdout.write('\n')
}

