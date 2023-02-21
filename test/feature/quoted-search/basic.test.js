export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'wireless chargers',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.113,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\ncars with wireless chargers are interesting\n' },
					},
					{
						_id: 'file2.md',
						_score: 1.076,
						title: 'file2',
						_chunk: { name: 'markdown', content: '\ncars with wireless phone chargers are interesting\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'results without quotes includes both',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: '"wireless chargers"',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.113,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\ncars with wireless chargers are interesting\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'results with quotes includes only the one',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cars \'wireless chargers\' "are interesting"',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 6.956,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\ncars with wireless chargers are interesting\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'results with quotes includes only the one',
		)
	},
]
