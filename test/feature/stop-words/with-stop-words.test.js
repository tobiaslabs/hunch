export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'archery and sport',
			}),
			{
				items: [
					{
						_id: 'file2.md',
						_score: 1.136,
						title: 'file2',
						_chunks: [ { name: 'markdown', content: '\narchery sport\n' } ],
					},
					{
						_id: 'file1.md',
						_score: 1.056,
						title: 'file1',
						_chunks: [ { name: 'markdown', content: '\narchery and sport\n' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'different score than WITHOUT stop words',
		)
	},
]
