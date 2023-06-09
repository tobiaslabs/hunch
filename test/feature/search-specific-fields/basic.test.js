export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cool',
			}),
			{
				items: [
					{
						_id: 'file2.md',
						_score: 1.04,
						description: 'curious',
						_chunks: [ { name: 'markdown', content: '\ncool\n' } ],
					},
					{
						_id: 'file1.md',
						_score: 1.04,
						description: 'cool',
						_chunks: [ { name: 'markdown', content: '\ncurious\n' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'since description is a searchable field both are returned',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cool',
				fields: [ 'description' ],
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.04,
						description: 'cool',
						_chunks: [ { name: 'markdown', content: '\ncurious\n' } ],
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
				fields: [ 'description', 'content' ],
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.04,
						description: 'cool',
						_chunks: [ { name: 'markdown', content: '\ncurious\n' } ],
					},
					{
						_id: 'file2.md',
						_score: 1.04,
						description: 'curious',
						_chunks: [ { name: 'markdown', content: '\ncool\n' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'so to search both you need to specify both',
		)
	},
]
