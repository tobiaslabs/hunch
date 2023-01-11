import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { fromQuery } from '../src/from-query.js'

test('turn query parameters into a hunch query', () => {
	assert.equal(
		fromQuery({
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
		fromQuery(new URL(`https://site.com?q=foo&${encodeURIComponent('facets[tags]')}=${encodeURIComponent('cats,-dogs')}`).searchParams),
		{
			q: 'foo',
			facetInclude: { tags: [ 'cats' ] },
			facetExclude: { tags: [ 'dogs' ] },
		},
	)
	assert.equal(
		fromQuery({ sort: 'anything' }),
		{ sort: 'anything' },
		'the sort property is passed along',
	)
	assert.equal(
		fromQuery({ sort: 3 }),
		{ sort: 3 },
		'it is untouched so your earlier changes will stick around',
	)

	assert.throws(
		() => fromQuery({ 'page[size]': '-3' }),
		/The parameter "page\[size]" must be an integer greater or equal to zero/,
	)
	assert.throws(
		() => fromQuery({ 'page[offset]': '-3' }),
		/The parameter "page\[offset]" must be an integer greater or equal to zero/,
	)
	assert.throws(
		() => fromQuery({ 'snippet[content]': '-3' }),
		/The parameter "snippet\[content]" must be an integer greater or equal to zero/,
	)
	assert.throws(
		() => fromQuery({ 'prefix': 'yes' }),
		/The parameter "prefix" must only be "true" or "false"./,
	)
	assert.throws(
		() => fromQuery({ 'suggest': 'yes' }),
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
			'fuzzy search',
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
			'snippet size',
			{ 'snippet[content]': '50' },
			{ snippet: { content: 50 } },
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
		assert.equal(fromQuery(query), expected, label)
})

test.run()
