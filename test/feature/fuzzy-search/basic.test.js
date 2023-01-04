export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'cats',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.04,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\ncats\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'results without fuzzing',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'cats',
				fuzzy: 0.8,
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.04,
						title: 'file1',
						_chunk: { name: 'markdown', content: '\ncats\n' },
					},
					{
						_id: 'file2.md',
						_score: 0.374,
						title: 'file2',
						_chunk: { name: 'markdown', content: '\nkats\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'results *with* fuzzing',
		)
	},
]
