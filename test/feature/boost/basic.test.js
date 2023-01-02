export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'cool words',
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 5.544, _content: '\ncool words but description is not cool words\n', description: 'words' },
					{ _id: 'file2.md', _score: 2.429, _content: '\nthese are curious\n', description: 'cool words' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'results without boosting',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'cool words',
				boost: { description: 10 },
			}),
			{
				items: [
					{ _id: 'file2.md', _score: 24.287, _content: '\nthese are curious\n', description: 'cool words' },
					{ _id: 'file1.md', _score: 10.945, _content: '\ncool words but description is not cool words\n', description: 'words' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'results *with* boosting',
		)
	},
]
