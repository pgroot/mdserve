/**
 * Created by GROOT on 2018-4-19.
 */
const markdownExtensions = [
	'markdown',
	'mdown',
	'mkdn',
	'md',
	'mkd',
	'mdwn',
	'mdtxt',
	'mdtext',
	'text'
]

const path = require('path')
const fs = require('fs')
const open = require('open')
const Promise = require('bluebird')
const connect = require('connect')
const less = require('less')
const jsdom = require('jsdom')
const send = require('send')
const chalk = require('chalk')

const MarkdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')

const {JSDOM} = jsdom

const md = new MarkdownIt({
	linkify: true,
	html: true
}).use(markdownItAnchor, {
	permalink: true,
	permalinkBefore: true,
	permalinkSymbol: ''
})

// eslint-disable-next-line no-console
const log = str => console.log(str)


// HasMarkdownExtension: check whether a file is Markdown type
const hasMarkdownExtension = path => {
	const fileExtension = path.substr(path.length - 3).toLowerCase()
	let extensionMatch = false

	markdownExtensions.forEach(extension => {
		if (`.${extension}` === fileExtension) {
			extensionMatch = true
		}
	})

	return extensionMatch
}


const markdownToHTML = markdownText => new Promise((resolve, reject) => {
	let result

	const s = Date.now()
	try {
		log(`render start...`)
		result = md.render(markdownText)
	} catch (err) {
		log(`render error`)
		log(err)
		return reject(err)
	}
	log(`whole render: ${Date.now() - s}ms`)
	resolve(result)
})


const getFile = path => new Promise((resolve, reject) => {
	fs.readFile(path, 'utf8', (err, data) => {
		if (err) {
			return reject(err)
		}
		resolve(data)
	})
})


const buildStyleSheet = cssPath =>
	new Promise(resolve =>
		getFile(cssPath).then(data =>
			less.render(data).then(data =>
				resolve(data.css)
			)
		)
	)


const linkify = (body, flags) => new Promise((resolve, reject) => {
	const dom = new JSDOM(body)

	if (!dom) {
		return reject(dom)
	}

	const {window} = dom

	const links = window.document.getElementsByTagName('a')
	const l = links.length

	let href
	let link
	let markdownFile
	let mdFileExists
	let relativeURL
	let isFileHref

	for (let i = 0; i < l; i++) {
		link = links[i]
		href = link.href
		isFileHref = href.substr(0, 8) === 'file:///'

		markdownFile = href.replace(path.join('file://', __dirname), flags.dir) + '.md'
		mdFileExists = fs.existsSync(markdownFile)

		if (isFileHref && mdFileExists) {
			relativeURL = href.replace(path.join('file://', __dirname), '') + '.md'
			link.href = relativeURL
		}
	}

	const html = window.document.getElementsByTagName('body')[0].innerHTML
	resolve(html)
})


const buildHTMLFromMarkDown = (markdownPath, flags) => new Promise(resolve => {
	const stack = [
		buildStyleSheet(flags.less),

		// Article
		getFile(markdownPath)
			.then(markdownToHTML)
			.then(html => linkify(html, flags)),


		flags.header && getFile(flags.header)
			.then(markdownToHTML)
			.then(html => linkify(html, flags)),


		flags.footer && getFile(flags.footer)
			.then(markdownToHTML)
			.then(html => linkify(html, flags)),

		flags.navigation && getFile(flags.navigation)
			.then(markdownToHTML)
			.then(html => linkify(html, flags))
	]

	Promise.all(stack).then(data => {
		const css = data[0]
		const htmlBody = data[1]
		const dirs = markdownPath.split('/')
		const title = dirs[dirs.length - 1].split('.md')[0]

		let header
		let footer
		let navigation
		let outputHtml

		if (flags.header) {
			header = data[2]
		}

		if (flags.footer) {
			footer = data[3]
		}

		if (flags.navigation) {
			navigation = data[4]
		}

		if (flags.less === flags.$mdserve.githubStylePath) {
			outputHtml = `<style>${css}</style><article class="markdown-body">${htmlBody}</article><script>hljs.initHighlightingOnLoad();</script>`
		} else {
			outputHtml = `<style>${css}</style>
	            <div class="container">
	              ${(header ? '<header>' + header + '</header>' : '')}
	              ${(navigation ? '<nav>' + navigation + '</nav>' : '')}
	              <article>${htmlBody}</article>
	              ${(footer ? '<footer>' + footer + '</footer>' : '')}
	            </div>
	          <script>hljs.initHighlightingOnLoad();</script>`
		}


		resolve(outputHtml)
	})
})


const scanDirectoryListing = (dir, exclude) => {
	let dirs = fs.readdirSync(dir)
	let valid = []
	dirs.forEach(subPath => {
		const isDir = fs.statSync(path.join(dir, subPath)).isDirectory()
		if (isDir) {
			if(exclude.toString().indexOf(subPath) < 0) {
				valid.push({
					type: 'dir',
					path: subPath
				})
			}
		} else {
			if(hasMarkdownExtension(subPath)) {
				valid.push({
					type: 'file',
					path: subPath
				})
			}

		}
	})
	return valid
}

const compile = async (file, options) => {
	return await buildHTMLFromMarkDown(file, options)
}

const findAnchors = (html) => {
	let dom = new JSDOM(html)
	const {window} = dom
	const links = window.document.getElementsByClassName('header-anchor')
	let anchors = []

	for(let i in links) {
		try {
			let href = links[i].getAttribute('href')
			let text = window.document.getElementById(href.replace("#", "")).innerHTML
			if(href) {
				anchors.push({
					href: href,
					label: text.replace(/<a(.*?)\/a>/, '')
				})
			}

		} catch (e) {}

	}

	return anchors
}

module.exports = {
	scanDirectoryListing,
	hasMarkdownExtension,
	buildHTMLFromMarkDown,
	compile,
	findAnchors
}