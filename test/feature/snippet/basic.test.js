export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'which is crooked',
				snippet: { '_chunks.content': 30 },
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 5.752,
						title: 'Ecclesiastes',
						_chunks: [ { name: 'markdown', content: '\nThat which is crooked can’t b' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'setting a snippet size to limit returned data',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'which is crooked',
				snippet: { '_chunks.content': 0 },
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 5.752,
						title: 'Ecclesiastes',
						_chunks: [ { name: 'markdown', content: '' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'if snippet size is zero the chunk returns but content is empty string',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'heart',
				snippet: { '_chunks.content': 15 },
			}).items[0]._chunks[0].content,
			' my heart to see',
			'it has 13 results in the document but finds the "best" match in the document',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'obtained',
				snippet: { '_chunks.content': 15 },
			}).items[0]._chunks[0].content,
			've obtained for ',
			'it only has 1 result in the document',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'test with',
				snippet: { '_chunks.content': 25 },
			}).items[0]._chunks[0].content,
			'w, I will test you with mi',
			'a split word does a search',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'flush',
				snippet: { '_chunks.content': 100 },
			}).items.length,
			0,
			'the word "flush" does not exist',
		)
		assert.equal(
			hunch({ index })({
				q: 'flush',
				snippet: { '_chunks.content': 30 },
				fuzzy: 0.2,
			}).items[0]._chunks[0].content,
			'o cheer my flesh with wine, my',
			'but with fuzziness it is found',
		)
	},
]
