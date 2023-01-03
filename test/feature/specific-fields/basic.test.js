export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'cool',
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 1.04, _content: '\ncurious\n', description: 'cool' },
					{ _id: 'file2.md', _score: 1.04, _content: '\ncool\n', description: 'curious' },
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'since description is a searchable field both are returned',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'cool',
				fields: [ 'description' ],
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 1.04, _content: '\ncurious\n', description: 'cool' },
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'specifying any field means you need to specify all fields',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'cool',
				fields: [ 'description', '_content' ],
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 1.04, _content: '\ncurious\n', description: 'cool' },
					{ _id: 'file2.md', _score: 1.04, _content: '\ncool\n', description: 'curious' },
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'so to search both you need to specify both',
		)
	},
]
