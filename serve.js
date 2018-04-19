/**
 * Created by GROOT on 2018-4-19.
 */

const markdown = require('./src/markdown')
const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
app.set('view engine', 'pug')
app.set('views', './src/views')
app.use('/assets', express.static(__dirname + '/assets'));

const run = (options) => {
	let staticDirs = options.static.split(',')
	staticDirs.forEach(d => {
		app.use('/'+d, express.static(options.dir + '/' + d))
	})

	app.get('/', (req, res) => {
		let action = req.query.type
		let dir = req.query.path ? decodeURIComponent(req.query.path) : '/'
		let absPath = path.join(options.dir, dir)
		let dirs = markdown.scanDirectoryListing(absPath, options.exclude)
		let dirArr = dir.split('/').filter((item)=> !!item)
		let currentFile
		let html
		let anchors

		switch (action) {
			case 'dir':
				currentFile = req.query.file
				html = ''
				anchors = []
				send()
				break;
			case 'file':
				currentFile = ''
				let mdFile = decodeURIComponent(req.query.file)
				console.log(`render file: ${mdFile}`)
				markdown.compile(path.join(absPath, mdFile), options).then(render => {
					html = render
					anchors = markdown.findAnchors(render)
					send()
				})
				break;
		}


		function send() {
			res.render('index', {
				parentDirectory: dirArr.length > 1 ? dirArr.slice(0, -1).join('/') : '/',
				dirs: dirs,
				baseDir: dir,
				currentDir: dirArr.pop() || 'Overview',
				currentFile: currentFile,
				html: html,
				anchors: anchors
			})
		}

	})


	app.listen(options.port, options.host, () => {
		console.log(`server started at ${options.host}:${options.port}`)
	});
}

module.exports = {
	run
}