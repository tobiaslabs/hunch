import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { generate } from '../src/generate.js'
import { fromQuery } from '../src/from-query.js'
import { hunch } from '../src/hunch.js'

await mkdir('build')

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
	mergeMetadata: ({ files }) => {
		// Once all files are parsed, you can build a merged object then available
		// to later steps in the flow. Here we are building a Set of all unique tags.
		const tags = new Set()
		for (const { metadata } of files) {
			if (metadata?.tags?.length)
				for (const tag of metadata.tags) tags.add(tag)
		}
		return { tags }
	},
	saveSite: async ({ site }) => {
		// After all files are parsed and the metadata is merged, you have the
		// option of saving that overall metadata.
		await writeFile('./build/site.json', JSON.stringify({
			...site,
			// Just pointing out that you can generate data in `mergeMetadata` that aren't
			// serializable to JSON, such as a Set. The Set is more efficient to use in
			// building content, but you'd need to serialize it here.
			tags: [ ...site.tags ],
		}, undefined, '\t'), 'utf8')
	},
	saveFile: async ({ file, metadata, blocks, files, site }) => {
		// You can also save the parsed file, if that's of service to you. This usually
		// makes sense when you need to use custom mdast->html conversion steps for
		// proper indexing, and in your CI/CD pipeline you don't want to run those same
		// exact steps twice to generate the content.
		//
		// Here we're not doing anything fancy, but since you have access to `files`
		// and `site` you can generate the finalized HTML.
		await mkdir(dirname(join('build', file)), { recursive: true })
		await writeFile(join('build', file + '.json'), JSON.stringify({
			metadata,
			blocks,
		}, undefined, '\t'), 'utf8')
	},
	verbose: true,
})
await writeFile('./build/hunch.json', JSON.stringify(hunchIndex, undefined, '\t'), 'utf8')
console.log('HunchJS completed...')

// You could even use Hunch for a CLI-based search tool, I suppose!
const index = JSON.parse(await readFile('./build/hunch.json', 'utf8'))
const search = hunch({ index })
const { items, page, facets } = search(fromQuery({
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
