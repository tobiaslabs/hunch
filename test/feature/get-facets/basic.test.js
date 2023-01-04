export default (assert, search) => [
	() => {
		assert.equal(
			search({
				pageSize: 0,
			}),
			{
				items: [],
				page: { items: 4 },
				facets: {
					tags: {
						dogs: 2,
						cats: 2,
						rabbits: 1,
					},
					series: {
						Animals: 2,
						'Fluffy Things': 1,
					},
				},
			},
			'get the full facet set by not using a query and no results via pageSize=0',
		)
	},
	() => {
		assert.equal(
			search({
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
						_chunk: {
							name: 'markdown',
							content: '\nwords in file1\n',
						},
					},
				],
				page: { items: 4, offset: 0, pages: 4, size: 1 },
				facets: {
					tags: {
						dogs: 2,
						cats: 2,
						rabbits: 1,
					},
					series: {
						Animals: 2,
						'Fluffy Things': 1,
					},
				},
			},
			'if you set the pageSize and do not have a query you get the full set',
		)
	},
]
