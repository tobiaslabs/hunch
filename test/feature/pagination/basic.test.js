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


				// - `items: Integer` - The total number of items found, outside of pagination.
				// - `offset: Integer` - The zero-index pagination offset, e.g. from the search request.
				// - `pages: Integer` - The total number of pages available.
				// - `size: Integer` - The page size, either from the search request or the internal default.

				page: { items: 4, offset: 0, pages: 1, size: 15 },
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
]
