export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'cool',
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 0.3, _content: '\ncool\n', series: 'bbb' },
					{ _id: 'file2.md', _score: 0.253, _content: '\ncool and curious\n', series: 'aaa' },
				],
				page: { offset: 0, size: 15, count: 1 },
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
					{ _id: 'file2.md', _score: 0.253, _content: '\ncool and curious\n', series: 'aaa' },
					{ _id: 'file1.md', _score: 0.3, _content: '\ncool\n', series: 'bbb' },
				],
				page: { offset: 0, size: 15, count: 1 },
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
