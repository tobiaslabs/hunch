export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cool',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 0.432,
						description: 'cool',
						summary: 'interesting',
						_chunks: [ { name: 'markdown', content: '\ncurious\n' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'normal returned data',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cool',
				includeFields: [ 'description' ],
			}),
			{
				items: [
					{
						_id: 'file1.md',
						description: 'cool',
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'specifying any field means you need to specify all fields',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cool',
				includeFields: [ '_chunks' ],
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_chunks: [ { name: 'markdown', content: '\ncurious\n' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'and that includes content',
		)
	},
]
