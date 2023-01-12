export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cool words',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 5.544,
						description: 'words',
						_chunk: { name: 'markdown', content: '\ncool words but description is not cool words\n' },
					},
					{
						_id: 'file2.md',
						_score: 2.429,
						description: 'cool words',
						_chunk: { name: 'markdown', content: '\nthese are curious\n' },
					},
				],
				page: { items: 2, offset: 0, pages: 1, size: 15 },
			},
			'results without boosting',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cool words',
				boost: { description: 10 },
			}),
			{
				items: [
					{
						_id: 'file2.md',
						_score: 24.287,
						description: 'cool words',
						_chunk: { name: 'markdown', content: '\nthese are curious\n' },
					},
					{
						_id: 'file1.md',
						_score: 10.945,
						description: 'words',
						_chunk: { name: 'markdown', content: '\ncool words but description is not cool words\n' },
					},
				],
				page: { items: 2, offset: 0, pages: 1, size: 15 },
			},
			'results *with* boosting',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cool words',
				boost: { field_that_does_not_exist: 10 },
			}),
			{
				items: [],
				page: { items: 0, offset: 0, pages: 0 },
			},
			'boosting a field that does not exist',
		)
	},
]
