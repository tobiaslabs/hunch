/*

This is an example of what a Cloudflare Worker might look like, if
the JSON bundle was loaded from KV.

---------------------------------------------------------------

In your Worker code you may want to do things like your own query parameter
normalization and validation, or some massaging of the search results
before you send them back.

This simple implementation doesn't do any of that, it just takes
the query parameters and hands them to Hunch directly.

*/

// Note that Workers don't support `import` so you'd need
// a build step for this.
import { hunch } from '../src/hunch.js'
import { fromQuery } from '../src/from-query.js'

let search

const fetch = async (request, env) => {
	if (!search) search = hunch({
		index: await env.KV_BINDING.get('your-hunch-key', { type: 'json' }),
	})
	return new Response(
		JSON.stringify(search(fromQuery(new URL(request.url).searchParams))),
		{ headers: { 'Content-Type': 'application/json' } },
	)
}
export default { fetch }

// Here we're simulating the fetch trigger from within Cloudflare, just to
// assert that it works.
import { readFile } from 'node:fs/promises'
const response = await fetch(
	{
		url: `https://site.com?q=${encodeURIComponent('you know what I like about cats')}&${encodeURIComponent('facets[tags]')}=${encodeURIComponent('cats,-dogs')}`,
	},
	{
		KV_BINDING: {
			get: async () => JSON.parse(await readFile('./build/hunch.json', 'utf8')),
		},
	},
)
console.log('The output from a Cloudflare Worker:', await response.json())
