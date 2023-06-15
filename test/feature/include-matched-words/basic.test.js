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
						_score: 0.311,
						_chunks: [
							{
								name: 'markdown',
								content: '\nit becomes necessary to kats a search engine\n',
							},
						],
						_matches: { '_chunks.content': 'kats', description: 'kats' },
						description: 'when in the kats of human events',
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'matched words in content and metadata',
		)
	},
]
