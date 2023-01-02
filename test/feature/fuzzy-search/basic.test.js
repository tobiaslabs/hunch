export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'cats',
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 1.04, _content: '\ncats\n' },
				],
				page: { offset: 0, size: 15, count: 1 },
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
					{ _id: 'file1.md', _score: 1.04, _content: '\ncats\n' },
					{ _id: 'file2.md', _score: 0.374, _content: '\nkats\n' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'results *with* fuzzing',
		)
	},
]
