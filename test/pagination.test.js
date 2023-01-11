import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { getOutputWithPagination } from '../src/utils/pagination.js'

const ITEMS = size => Array(size).fill('').map((_, i) => i.toString())

test('get pagination', () => {
	assert.equal(
		getOutputWithPagination({
			query: {},
			searchResults: ITEMS(100),
		}),
		{
			items: ITEMS(15),
			page: {
				items: 100,
				offset: 0,
				pages: Math.ceil(100 / 15),
				size: 15,
			},
		},
		'when no page size is given and no max size is given it uses the default max',
	)
	assert.equal(
		getOutputWithPagination({
			query: {
				pageSize: 100_000,
			},
			searchResults: ITEMS(100_000),
		}),
		{
			items: ITEMS(100_000),
			page: {
				items: 100_000,
				offset: 0,
				pages: 1,
				size: 100_000,
			},
		},
		'when a page size is given and no max page size is set even if very big!!!',
	)
	assert.equal(
		getOutputWithPagination({
			query: {
				pageSize: 100,
			},
			searchResults: ITEMS(2),
		}),
		{
			items: ITEMS(2),
			page: {
				items: 2,
				offset: 0,
				pages: 1,
				size: 100,
			},
		},
		'when you set a page size bigger than result set',
	)
	assert.equal(
		getOutputWithPagination({
			query: {
				pageSize: 100_000,
			},
			maxPageSize: 10,
			searchResults: ITEMS(100_000),
		}),
		{
			items: ITEMS(10),
			page: {
				items: 100_000,
				offset: 0,
				pages: 100_000 / 10,
				size: 10,
			},
		},
		'but if a max page size is set it overrides whatever is passed in',
	)
	assert.equal(
		getOutputWithPagination({
			query: {
				pageSize: 2,
				pageOffset: 2,
			},
			searchResults: ITEMS(100),
		}),
		{
			items: [ '4', '5' ],
			page: {
				items: 100,
				offset: 2,
				pages: 100 / 2,
				size: 2,
			},
		},
		'if an offset is passed in it gives the correct items',
	)
	assert.equal(
		getOutputWithPagination({
			query: {
				pageSize: 0,
			},
			searchResults: ITEMS(100),
		}),
		{
			items: [],
			page: {
				items: 100,
				size: 0,
			},
		},
		'if you pass in 0 page size it just gives you an empty list',
	)
})

test.run()
