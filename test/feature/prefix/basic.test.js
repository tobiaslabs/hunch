export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'moto',
			}),
			{
				items: [],
				page: { offset: 0, pages: 0, items: 0 },
			},
			'without prefix it looks for exactly "moto" as a term',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'moto',
				prefix: true,
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 0.334,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\nmotocross\n' },
					},
					{
						_id: 'file2.md',
						_score: 0.33,
						title: 'file2',
						_chunk: { name: 'markdown', content: '\nmotorcycle\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'with a prefix it returns all',
		)
	},
]
