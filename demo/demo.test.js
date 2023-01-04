import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { generate } from '../dist/generate.js'
import { normalize } from '../dist/normalize.js'
import { hunch } from '../dist/hunch.js'

// We can use the CLI, or programmatically call Hunch, like this:
const hunchIndex = await generate({
	input: './content',
	searchableFields: [
		'title',
	],
	storeFields: [
		// These would be fields that you don't want searched, but want returned
		// on the results.
		'notes',
	],
	facets: [
		'series',
		'tags',
	],
	verbose: true,
})
await mkdir('build')
await writeFile('./build/hunch.json', JSON.stringify(hunchIndex, undefined, '\t'), 'utf8')
console.log('HunchJS completed...')

// You could even use Hunch for a CLI-based search tool, I suppose!
const index = JSON.parse(await readFile('./build/hunch.json', 'utf8'))
const search = hunch({ index })
const { items, page, facets } = search(normalize({
	q: 'you know what I like about cats',
	'facets[tags]': 'cats,-dogs',
}))

console.log('==== page ====', JSON.stringify(page, undefined, 4))
console.log('==== facets ====', JSON.stringify(facets, undefined, 4))
console.log('==== items ====', JSON.stringify(items, undefined, 4))

// For completeness, this test is going to run the other demos, just to make
// sure they still work after every change.
await import('./cloudflare-worker.js')
await import('./lambda-api-gateway.js')
