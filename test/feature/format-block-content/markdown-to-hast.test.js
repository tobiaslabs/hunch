export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cats',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.04,
						title: 'file1',
						_chunks: [ { name: 'markdown', content: 'cats with markdown' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'find the markdown content of the blockdown backwards-compatible first block',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'clever',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.04,
						title: 'file1',
						_chunks: [ { name: 'markdown', content: 'very clever words' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'find the markdown content of the second block',
		)
	},
]
