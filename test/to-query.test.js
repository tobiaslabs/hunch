import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { toQuery } from '../src/to-query.js'

const toString = obj => {
	let params = []
	for (const key of Object.keys(obj).sort()) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
	return params.join('&')
}

test('turn query parameters into a hunch query', () => {
	assert.equal(
		toQuery({
			q: 'foo',
			facetInclude: { tags: [ 'cats' ] },
			facetExclude: { tags: [ 'dogs' ] },
		}),
		toString({
			q: 'foo',
			'facets[tags]': 'cats,-dogs',
		}),
	)
	assert.equal(
		toQuery({
			sort: [
				{ key: 'foo', descending: false },
				{ key: 'bar', descending: true },
			],
		}),
		toString({ sort: 'foo,-bar' }),
		'the sort is passed along as well',
	)
	assert.equal(
		toQuery({ sort: [] }),
		toString({}),
		'an empty array does nothing',
	)

	const testEveryProperty = [
		[
			'boost',
			{ boost: { title: 2, summary: 3 } },
			{ 'boost[title]': '2', 'boost[summary]': '3' },
		],
		[
			'by id',
			{ id: 'foo' },
			{ id: 'foo' },
		],
		[
			'facets',
			{
				facetInclude: { tags: [ 'cats' ] },
				facetExclude: { tags: [ 'dogs' ] },
			},
			{ 'facets[tags]': 'cats,-dogs' },
		],
		[
			'full text lookup',
			{ q: 'exact words' },
			{ q: 'exact words' },
		],
		[
			'fuzzy search',
			{ fuzzy: 0.8 },
			{ fuzzy: '0.8' },
		],
		[
			'pagination',
			{ pageSize: 4, pageOffset: 2 },
			{ 'page[size]': '4', 'page[offset]': '2' },
		],
		[
			'prefix',
			{ prefix: true },
			{ prefix: 'true' },
		],
		[
			'snippet size',
			{ snippet: { content: 50 } },
			{ 'snippet[content]': '50' },
		],
		[
			'specific fields',
			{ fields: [ 'title', 'summary' ] },
			{ 'fields': 'title,summary' },
		],
		[
			'suggestion',
			{ suggest: true },
			{ suggest: 'true' },
		],
	]
	for (const [ label, query, expected ] of testEveryProperty)
		assert.equal(toQuery(query), toString(expected), label)
})

test.run()
