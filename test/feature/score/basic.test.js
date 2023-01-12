export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cooler than cool',
			}),
			{
				items: [
					{
						_id: 'file2.md',
						_score: 7.165,
						title: 'file2',
						_chunk: {
							name: 'markdown',
							content: '\nwhat is cooler than cool other than cool itself?\n',
						},
					},
					{
						_id: 'file1.md',
						_score: 0.328,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\ncool\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'different scores',
		)
	},
]
