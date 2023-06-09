export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				includeFacets: [ 'tags' ],
			}),
			{
				items: [
					{
						_id: 'file1.md',
						title: 'file1',
						// The `includeFacets` limits the `facets` map, but
						// not the returned items.
						series: 'Animals',
						tags: [ 'cats' ],
						_chunks: [ {
							name: 'markdown',
							content: '\nwords in file1\n',
						} ],
					},

				],
				page: { items: 1, size: 15, offset: 0, pages: 1 },
				facets: {
					tags: {
						cats: { all: 1, search: 1 },
					},
				},
			},
			'get only the specific facets',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				includeFacets: [ '*' ],
			}),
			{
				items: [
					{
						_id: 'file1.md',
						title: 'file1',
						series: 'Animals',
						tags: [ 'cats' ],
						_chunks: [ {
							name: 'markdown',
							content: '\nwords in file1\n',
						} ],
					},

				],
				page: { items: 1, size: 15, offset: 0, pages: 1 },
				facets: {
					tags: {
						cats: { all: 1, search: 1 },
					},
					series: {
						Animals: { all: 1, search: 1 },
					},
				},
			},
			'get all facets',
		)
	},
]
