export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'cool',
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 0.158, _content: '\ncool\n' },
					{ _id: 'file2.md', _score: 0.158, _content: '\ncool\n' },
					{ _id: 'file3.md', _score: 0.158, _content: '\ncool\n' },
					{ _id: 'file4.md', _score: 0.158, _content: '\ncool\n' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'results without pagination',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'cool',
				pageSize: 2,
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 0.158, _content: '\ncool\n' },
					{ _id: 'file2.md', _score: 0.158, _content: '\ncool\n' },
				],
				page: { offset: 0, size: 2, count: 2 },
			},
			'set page size to see different pagination output',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'cool',
				pageSize: 2,
				pageOffset: 1,
			}),
			{
				items: [
					{ _id: 'file3.md', _score: 0.158, _content: '\ncool\n' },
					{ _id: 'file4.md', _score: 0.158, _content: '\ncool\n' },
				],
				page: { offset: 1, size: 2, count: 2 },
			},
			'page size and offset',
		)
	},
]
