import { join } from 'node:path'
import { readdir } from 'node:fs/promises'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { generate } from '../src/generate.js'
import { hunch } from '../src/hunch.js'

const CWD = process.cwd()

const features = [
	'boost',
	'by-id',
	'facet',
	'full-text-lookup',
	'fuzzy-search',
	'get-facets',
	'pagination',
	'prefix',
	'score',
	'sort',
	'specific-fields',
	'stop-words',
	'stored-fields',
	'suggest',
]

const verbose = process.argv.includes('--verbose')

const original = {}
const silence = () => {
	for (const level in console) {
		original[level] = console[level]
		if (!verbose) console[level] = _ => _
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
		const { default: options, setup } = await import(`./feature/${feature}/${conf}.config.js`)
		options.cwd = join(CWD, 'test', 'feature', feature)
		options.input = `./content-${conf}`
		if (verbose) options.verbose = true
		testTree[feature][conf] = {
			search: hunch({
				...(setup || {}),
				index: await generate(options),
			}),
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
