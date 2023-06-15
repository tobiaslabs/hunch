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
						_score: 13.005,
						title: 'Ecclesiastes',
						_chunks: [
							{
								name: 'markdown',
								content: 'wind.\nThat which is crooked can’t',
								snippet: {
									content: { before: 1499, after: 4780 },
								},
							},
						],
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
				q: 'strikingly',
				snippet: { '_chunks.content': 10 },
			}).items[0]._chunks[0],
			{
				name: 'markdown',
				content: 'strikingly',
				snippet: {
					content: {
						before: '\nzebra now read a '.length, // 17
						after: ' different word\n'.length, // 16
					},
				},
			},
			'before with word boundary characters',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'read',
				snippet: { '_chunks.content': 4 },
			}).items[0]._chunks[0],
			{
				name: 'markdown',
				content: 'read',
				snippet: {
					content: {
						before: '\nzebra now '.length, // 14
						after: ' a strikingly different word\n'.length, // 18
					},
				},
			},
			'setting a snippet size in the middle',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'zebra',
				snippet: { '_chunks.content': 5 },
			}).items[0]._chunks[0],
			{
				name: 'markdown',
				content: 'zebra',
				snippet: {
					content: {
						before: 0,
						after: ' now read a strikingly different word\n'.length, // 38
					},
				},
			},
			'setting a snippet size at the start',
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
						_score: 13.005,
						title: 'Ecclesiastes',
						_chunks: [
							{
								name: 'markdown',
								content: '',
							},
						],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'if snippet size is zero the chunk returns but content is empty string and snip not set',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'heart',
				snippet: { '_chunks.content': 15 },
			}).items[0]._chunks[0].content,
			'ed my heart to see',
			'it has 13 results in the document but finds the "best" match in the document',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'obtained',
				snippet: { '_chunks.content': 15 },
			}).items[0]._chunks[0].content,
			'have obtained for',
			'it only has 1 result in the document',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'test with',
				snippet: { '_chunks.content': 25 },
			}).items[0]._chunks[0].content,
			'now, I will test you with mi',
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
			}).items[0]._chunks[0],
			{
				name: 'markdown',
				content: 'to cheer my flesh with wine, my',
				snippet: {
					content: {
						before: 27,
						after: 181,
					},
				},
			},
			'but with fuzziness it is found',
		)
	},
]
