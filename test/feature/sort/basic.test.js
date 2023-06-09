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
						_score: 0.3,
						series: 'bbb',
						title: 'file1',
						_chunks: [ { name: 'markdown', content: '\ncool\n' } ],
					},
					{
						_id: 'file2.md',
						_score: 0.253,
						title: 'file2',
						series: 'aaa',
						_chunks: [ { name: 'markdown', content: '\ncool and curious\n' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
				facets: {
					series: {
						aaa: { all: 1, search: 1 },
						bbb: { all: 1, search: 1 },
					},
				},
			},
			'results without sorting',
		)
	},
	() => {
		assert.equal(
			hunch({
				index,
				sort: ({ items, query }) => {
					return query.sort === 'series'
						? items.sort((a, b) => (a.series || '').localeCompare(b.series || ''))
						: items
				},
			})({
				q: 'cool',
				sort: 'series',
			}),
			{
				items: [
					{
						_id: 'file2.md',
						_score: 0.253,
						title: 'file2',
						series: 'aaa',
						_chunks: [ { name: 'markdown', content: '\ncool and curious\n' } ],
					},
					{
						_id: 'file1.md',
						_score: 0.3,
						series: 'bbb',
						title: 'file1',
						_chunks: [ { name: 'markdown', content: '\ncool\n' } ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
				facets: {
					series: {
						aaa: { all: 1, search: 1 },
						bbb: { all: 1, search: 1 },
					},
				},
			},
			'results with sorting using a custom function',
		)
	},
]
