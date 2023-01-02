import { join } from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { generate } from '../src/generate.js'
import { hunch } from '../src/hunch.js'

const CWD = process.cwd()

const features = [
	'boost',
	'facet',
	'full-text-lookup',
	'fuzzy-search',
	'metadata-sort',
	// 'pagination',
	// 'prefix',
	// 'score',
	// 'specific-fields',
	// 'stop-words',
	// 'suggest',
]

const original = {}
const silence = () => {
	for (const level in console) {
		original[level] = console[level]
		console[level] = _ => _
	}
	return () => { for (const level in console) console[level] = original[level] }
}

console.log('Generating indexes for all tests:')
const testTree = {}
for (const feature of features) {
	console.log('-', feature)
	testTree[feature] = {}
	let configurations = await readdir(`./test/feature/${feature}`)
	configurations = configurations
		.filter(c => c.endsWith('.config.js'))
		.map(c => c.replace(/\.config\.js$/, ''))
		.sort()
	const log = console.log
	const unsilence = silence()
	for (const conf of configurations) {
		log('  -', conf)
		const { default: options } = await import(`./feature/${feature}/${conf}.config.js`)
		options.cwd = join(CWD, 'test', 'feature', feature)
		options.indent = '\t'
		options.input = `./content-${conf}`
		options.output = `./build/${conf}.json`
		await generate(options)
		testTree[feature][conf] = {
			search: hunch({ index: JSON.parse(await readFile(`./test/feature/${feature}/build/${conf}.json`, 'utf8')) }),
			runner: await import(`./feature/${feature}/${conf}.test.js`).then(i => i.default),
		}
	}
	unsilence()
}

console.log('Validating all assertions...')
for (const feature in testTree) {
	for (const conf in testTree[feature]) {
		test(`${feature}: ${conf}`, () => {
			const testList = testTree[feature][conf].runner(assert, testTree[feature][conf].search)
			for (const t of testList) t()
		})
	}
}

test.run()
