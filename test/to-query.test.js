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
			facetMustMatch: { tags: [ 'cats' ] },
			facetMustMatchAny: { tags: [ 'rabbits' ] },
			facetMustNotMatch: { tags: [ 'dogs' ] },
		}),
		toString({
			q: 'foo',
			'facets[tags]': 'cats,~rabbits,-dogs',
		}),
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
				facetMustMatch: { tags: [ 'cats' ] },
				facetMustMatchAny: { tags: [ 'rabbits' ] },
				facetMustNotMatch: { tags: [ 'dogs' ] },
			},
			{ 'facets[tags]': 'cats,~rabbits,-dogs' },
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
		[
			'sort',
			{
				sort: [
					{ key: 'foo', descending: false },
					{ key: 'bar', descending: true },
				],
			},
			{ sort: 'foo,-bar' },
		],
		[
			'empty sort',
			{ sort: [] },
			{},
		],
		[
			'include fields',
			{ includeFields: [ 'foo', 'bar' ] },
			{ 'include[fields]': 'foo,bar' },
		],
		[
			'include facets',
			{ includeFacets: [ 'foo', 'bar' ] },
			{ 'include[facets]': 'foo,bar' },
		],
	]
	for (const [ label, query, expected ] of testEveryProperty)
		assert.equal(toQuery(query), toString(expected), label)
})

test.run()
