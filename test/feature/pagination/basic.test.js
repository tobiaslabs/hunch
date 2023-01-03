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
				],
				page: { items: 4, offset: 0, pages: 2, size: 3 },
			},
			'results without pagination limited by max page size',
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
				page: { items: 4, offset: 0, pages: 2, size: 2 },
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
				page: { items: 4, offset: 1, pages: 2, size: 2 },
			},
			'page size and offset',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'cool',
				pageSize: 100,
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 0.158, _content: '\ncool\n' },
					{ _id: 'file2.md', _score: 0.158, _content: '\ncool\n' },
					{ _id: 'file3.md', _score: 0.158, _content: '\ncool\n' },
				],
				page: { items: 4, offset: 0, pages: 2, size: 3 },
			},
			'attempting to go over max page size fails',
		)
	},
]
