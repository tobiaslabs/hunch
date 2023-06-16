export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cats',
				fuzzy: 0.2,
				includeMatches: true,
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 0.372,
						_chunks: [
							{
								name: 'markdown',
								content: '\nit becomes necessary to cats a search engine\n',
								matches: { content: [ 'cats' ] },
							},
						],
						_matches: { description: [ 'kats' ] },
						description: 'when in the kats of human events',
					},
					{
						_id: 'file2.md',
						_score: 0.372,
						_chunks: [
							{
								name: 'markdown',
								content: '\nit becomes necessary to cats a search engine\n',
								matches: { content: [ 'cats' ] },
							},
						],
						_matches: { description: [ 'kats' ] },
						description: 'when in the kats of human events',
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'matched words in content and metadata',
		)
	},
]
