export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'which is crooked',
				snippet: { content: 30 },
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 5.752,
						title: 'Ecclesiastes',
						_chunk: { name: 'markdown', content: '\nThat which is crooked can’t b' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'setting a snippet size to limit returned data',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'which is crooked',
				snippet: { content: 0 },
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 5.752,
						title: 'Ecclesiastes',
						_chunk: { name: 'markdown', content: '' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'if snippet size is zero the chunk returns but content is empty string',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'heart',
				snippet: { content: 15 },
			}).items[0]._chunk.content,
			' my heart to see',
			'it has 13 results in the document but finds the "best" match in the document',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'obtained',
				snippet: { content: 15 },
			}).items[0]._chunk.content,
			've obtained for ',
			'it only has 1 result in the document',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'test with',
				snippet: { content: 25 },
			}).items[0]._chunk.content,
			'w, I will test you with mi',
			'a split word does a search',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'flush',
				snippet: { content: 100 },
			}).items.length,
			0,
			'the word "flush" does not exist',
		)
		assert.equal(
			search({
				q: 'flush',
				snippet: { content: 30 },
				fuzzy: 0.2,
			}).items[0]._chunk.content,
			'o cheer my flesh with wine, my',
			'but with fuzziness it is found',
		)
	},
]
