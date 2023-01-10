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

	assert.throws(
		() => normalize({ 'page[size]': '-3' }),
		/The parameter "page\[size]" must be a positive integer./,
	)
	assert.throws(
		() => normalize({ 'page[offset]': '-3' }),
		/The parameter "page\[offset]" must be a positive integer./,
	)
	assert.throws(
		() => normalize({ 'prefix': 'yes' }),
		/The parameter "prefix" must only be "true" or "false"./,
	)
	assert.throws(
		() => normalize({ 'suggest': 'yes' }),
		/The parameter "suggest" must only be "true" or "false"./,
	)

	const testEveryProperty = [
		[
			'boost',
			{ 'boost[title]': '2', 'boost[summary]': '3' },
			{ boost: { title: 2, summary: 3 } },
		],
		[
			'by id',
			{ id: 'foo' },
			{ id: 'foo' },
		],
		[
			'facets',
			{ 'facets[tags]': 'cats,-dogs' },
			{
				facetInclude: { tags: [ 'cats' ] },
				facetExclude: { tags: [ 'dogs' ] },
			},
		],
		[
			'full text lookup',
			{ q: 'exact words' },
			{ q: 'exact words' },
		],
		[
			'',
			{ fuzzy: '0.8' },
			{ fuzzy: 0.8 },
		],
		[
			'pagination',
			{ 'page[size]': '4', 'page[offset]': '2' },
			{ pageSize: 4, pageOffset: 2 },
		],
		[
			'prefix',
			{ prefix: 'true' },
			{ prefix: true },
		],
		[
			'specific fields',
			{ 'fields': 'title,summary' },
			{ fields: [ 'title', 'summary' ] },
		],
		[
			'suggestion',
			{ suggest: 'true' },
			{ suggest: true },
		],
	]
	for (const [ label, query, expected ] of testEveryProperty)
		assert.equal(normalize(query), expected, label)
})

test.run()
