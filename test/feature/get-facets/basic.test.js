export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				pageSize: 0,
			}),
			{
				items: [],
				page: { items: 4, size: 0 },
				facets: {
					tags: {
						dogs: { all: 2, search: 2 },
						cats: { all: 2, search: 2 },
						rabbits: { all: 1, search: 1 },
					},
					series: {
						Animals: { all: 2, search: 2 },
						'Fluffy Things': { all: 1, search: 1 },
					},
				},
			},
			'get the full facet set by not using a query and no results via pageSize=0',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				pageSize: 1,
			}),
			{
				items: [
					{
						_id: 'file1.md',
						title: 'file1',
						series: 'Animals',
						tags: [ 'cats', 'dogs' ],
						published: '2022-12-20',
						_chunks: [ {
							name: 'markdown',
							content: '\nwords in file1\n',
						} ],
					},
				],
				page: { items: 4, offset: 0, pages: 4, size: 1 },
				facets: {
					tags: {
						dogs: { all: 2, search: 2 },
						cats: { all: 2, search: 2 },
						rabbits: { all: 1, search: 1 },
					},
					series: {
						Animals: { all: 2, search: 2 },
						'Fluffy Things': { all: 1, search: 1 },
					},
				},
			},
			'if you set the pageSize and do not have a query you get the full set',
		)
	},
]
