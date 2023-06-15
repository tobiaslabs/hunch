import { join } from 'node:path'
import { readdir } from 'node:fs/promises'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { generate } from '../src/generate.js'
import { hunch } from '../src/hunch.js'

const CWD = process.cwd()

/*

Test a single feature, e.g.:

	node test/feature.test.js facet-matching

Test the configuration of a single feature, e.g. from the $NAME.config.js:

	node test/feature.test.js format-block-content markdown-to-hast

Add the `--verbose` flag at the end for more logs, e.g.:

	node test/feature.test.js format-block-content markdown-to-hast --verbose

*/
let [ , , namedFeature, namedConfiguration ] = process.argv
if (namedConfiguration === '--verbose') namedConfiguration = ''

const features = namedFeature
	? [ namedFeature ]
	:[
		'boost',
		'by-id',
		'exact-phrase',
		'facet-matching',
		'format-block-content',
		'full-text-lookup',
		'fuzzy-search',
		'get-facets',
		'huge-text-search',
		'include-matched-words',
		'multiple-chunks',
		'pagination',
		'prefix',
		'return-specific-facets',
		'return-specific-fields',
		'save-file',
		'score',
		'search-specific-fields',
		'snippet',
		'sort',
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
	let configurations
	if (namedConfiguration) {
		configurations = [ namedConfiguration ]
	} else {
		configurations = await readdir(`./test/feature/${feature}`)
		configurations = configurations
			.filter(c => c.endsWith('.config.js'))
			.map(c => c.replace(/\.config\.js$/, ''))
			.sort()
	}
	const log = console.log
	const unsilence = silence()
	for (const conf of configurations) {
		log('  -', conf)
		const { default: options } = await import(`./feature/${feature}/${conf}.config.js`)
		options.cwd = join(CWD, 'test', 'feature', feature)
		options.input = `./content-${conf}`
		options.searchableFields = options.searchableFields || [ 'description', 'title' ]
		if (verbose) options.verbose = true
		testTree[feature][conf] = {
			index: await generate(options),
			runner: await import(`./feature/${feature}/${conf}.test.js`).then(i => i.default),
		}
	}
	unsilence()
}

console.log('Validating all assertions...')
for (const feature in testTree) {
	for (const conf in testTree[feature]) {
		test(`${feature}: ${conf}`, async () => {
			const testList = testTree[feature][conf].runner({ assert, hunch, index: testTree[feature][conf].index })
			for (const t of testList) await t()
		})
	}
}

test.run()
