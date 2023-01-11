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
		toQuery({ sort: 'only strings' }),
		toString({ sort: 'only strings' }),
		'the sort is passed along as well',
	)
	assert.equal(
		toQuery({ sort: { foo: 3 } }),
		toString({ sort: '[object Object]' }),
		'the toString() is called to cast',
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
