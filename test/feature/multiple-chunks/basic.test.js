export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'exciting',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.004,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\nSome exciting words.\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'it returns the chunk that best matches',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'more',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.08,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\nMore words.\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'so here it will return the second chunk instead',
		)
	},
]
