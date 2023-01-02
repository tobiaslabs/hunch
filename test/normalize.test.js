import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { normalize } from '../src/normalize.js'

test('normalize query parameters', () => {
	assert.equal(
		normalize({
			q: 'foo',
			'facets[tags]': 'cats,-dogs',
		}),
		{
			q: 'foo',
			facetInclude: { tags: [ 'cats' ] },
			facetExclude: { tags: [ 'dogs' ] },
		},
	)
	assert.equal(
		normalize(new URL(`https://site.com?q=foo&${encodeURIComponent('facets[tags]')}=${encodeURIComponent('cats,-dogs')}`).searchParams),
		{
			q: 'foo',
			facetInclude: { tags: [ 'cats' ] },
			facetExclude: { tags: [ 'dogs' ] },
		},
	)
})

test.run()
