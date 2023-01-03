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
					{ _id: 'file1.md', _score: 0.334, _content: '\nmotocross\n' },
					{ _id: 'file2.md', _score: 0.33, _content: '\nmotorcycle\n' },
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'with a prefix it returns all',
		)
	},
]
