import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { filterForMatchingPhrases } from '../src/utils/filter-for-matching-phrases.js'

const getIds = item => item.id

test('turn query parameters into a hunch query', () => {
	assert.equal(
		filterForMatchingPhrases(
			'"wireless chargers"',
			[
				{
					id: '0:0',
					terms: [ 'wireless', 'chargers' ],
					match: { wireless: [ 'content' ], chargers: [ 'content' ] },
					content: '\ncars with wireless phone chargers are interesting\n',
				},
				{
					id: '1:0',
					terms: [ 'wireless', 'chargers' ],
					match: { wireless: [ 'content' ], chargers: [ 'content' ] },
					content: '\ncars with wireless chargers are interesting\n',
				},
			],
		).map(getIds),
		[
			'1:0',
		],
		'matches the one that has the search phrase as exact',
	)
	assert.equal(
		filterForMatchingPhrases(
			'"wIrElEsS chargers"',
			[
				{
					id: '1:0',
					terms: [ 'wireless', 'chargers' ],
					match: { wireless: [ 'content' ], chargers: [ 'content' ] },
					content: '\ncars with WiReLeSs chargers are interesting\n',
				},
			],
		).map(getIds),
		[
			'1:0',
		],
		'case is ignored both on the search query and the item properties',
	)
	assert.equal(
		filterForMatchingPhrases(
			'"wireless chargers"',
			[
				{
					id: '0:0',
					terms: [ 'wireless', 'chargers' ],
					match: { wireless: [ 'content' ], chargers: [ 'title' ] },
					content: '\nwireless cars\n',
					title: 'chargers today',
				},
			],
		).map(getIds),
		[],
		'since the phrase was not on the same property it does not match',
	)
	assert.equal(
		filterForMatchingPhrases(
			'cars with "wireless chargers"',
			[
				{
					id: '1:0',
					terms: [ 'cars', 'with', 'wireless', 'chargers' ],
					match: { cars: [ 'content' ], with: [ 'content' ], wireless: [ 'content' ], chargers: [ 'content' ] },
					content: '\ncars with wireless chargers are interesting\n',
				},
			],
		).map(getIds),
		[
			'1:0',
		],
		'the quoted phrase is in the terms but the terms contains more than only the quoted phrase',
	)
})

test.run()
