#!/usr/bin/env node

const path = require('path')
const options = require('commander')
const mdserve = require('./serve')

const pkg = require('./package.json')

const githubStylePath = path.join(__dirname, 'assets/less/github.less')

options.version(pkg.version)
	.option('-d, --dir [type]', 'Serve from directory [dir]', './')
	.option('-p, --port [type]', 'Serve on port [port]', '8080')
	.option('-h, --host [type]', 'Serve on ip/address [address]', 'localhost')
	.option('-H, --header [type]', 'Header template .md file', null)
	.option('-r, --footer [type]', 'Footer template .md file', null)
	.option('-n, --navigation [type]', 'Navigation .md file', null)
	.option('-s, --less [type]', 'Path to Less styles [less]', githubStylePath)
	.option('-f, --file [type]', 'Open specific file in browser [file]')
	.option('-x, --x', 'Don\'t open browser on run.')
	.option('-e, --exclude [type]', 'exclude directory [dir]', '')
	.option('-S, --static [type]', 'express static directory [dir]', '')
	.option('-v, --verbose', 'verbose output')

	.parse(process.argv)

options.$mdserve = {
	githubStylePath
}

mdserve.run(options)