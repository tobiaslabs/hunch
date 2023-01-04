export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'cool',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 0.3,
						series: 'bbb',
						title: 'file1',
						_chunk: { name: 'markdown', content: '\ncool\n' },
					},
					{
						_id: 'file2.md',
						_score: 0.253,
						title: 'file2',
						series: 'aaa',
						_chunk: { name: 'markdown', content: '\ncool and curious\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
				facets: {
					series: {
						aaa: 1,
						bbb: 1,
					},
				},
			},
			'results without sorting',
		)
	},
	() => {
		assert.equal(
			search({
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
						_chunk: { name: 'markdown', content: '\ncool and curious\n' },
					},
					{
						_id: 'file1.md',
						_score: 0.3,
						series: 'bbb',
						title: 'file1',
						_chunk: { name: 'markdown', content: '\ncool\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
				facets: {
					series: {
						aaa: 1,
						bbb: 1,
					},
				},
			},
			'results with sorting the scores are retained',
		)
	},
]
