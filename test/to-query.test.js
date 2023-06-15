import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { toQuery } from '../src/to-query.js'

const toString = obj => {
	let params = []
	for (const key of Object.keys(obj).sort()) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
	return params.join('&')
}

test('every query parameter all at once', () => {
	assert.equal(
		toQuery({
			q: 'foo',
			boost: { title: 2, summary: 3 },
			facetMustMatch: { tags: [ 'cats', 'felines' ] },
			facetMustMatchAny: { tags: [ 'rabbits', 'squirrels' ] },
			facetMustNotMatch: { tags: [ 'dogs', 'wolves' ] },
			fields: [ 'title', 'summary' ],
			fuzzy: 0.8,
			includeFacets: [ 'foo', 'bar' ],
			includeFields: [ 'foo', 'bar' ],
			includeMatches: true,
			pageSize: 4,
			pageOffset: 2,
			prefix: true,
			snippet: { content: 50 },
			sort: [
				{ key: 'foo', descending: false },
				{ key: 'bar', descending: true },
			],
			suggest: true,
		}),
		toString({
			q: 'foo',
			'boost[title]': '2',
			'boost[summary]': '3',
			'facets[tags]': 'cats,felines,~rabbits,~squirrels,-dogs,-wolves',
			'fields': 'title,summary',
			fuzzy: '0.8',
			'include[facets]': 'foo,bar',
			'include[fields]': 'foo,bar',
			'include[matches]': '',
			'page[size]': '4',
			'page[offset]': '2',
			prefix: 'true',
			'snippet[content]': '50',
			sort: 'foo,-bar',
			suggest: 'true',
		}),
	)
})

test('specific query parameter scenarios', () => {
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
			'matches as anything truthy',
			{
				includeMatches: 3,
			},
			{ 'include[matches]': '' },
		],
		[
			'ignored if anything truthy',
			{
				includeMatches: 0,
			},
			{},
		],
		[
			'facets with multiple values',
			{
				facetMustMatch: { tags: [ 'cats', 'felines' ] },
				facetMustMatchAny: { tags: [ 'rabbits', 'squirrels' ] },
				facetMustNotMatch: { tags: [ 'dogs', 'wolves' ] },
			},
			{ 'facets[tags]': 'cats,felines,~rabbits,~squirrels,-dogs,-wolves' },
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
