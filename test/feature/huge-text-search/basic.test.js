export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'present',
				pageSize: 1,
				snippet: {
					'_chunks.content': 100,
				},
			}),
			{
				items: [
					{
						_id: 'romans/chapter-6.md',
						_score: 6.103,
						_chunks: [
							{
								name: 'markdown',
								content: 'you should obey it in its lusts.  Also, do not present your members to sin as instruments of unrighteou',
								snippet: {
									content: { before: 1162, after: 1379 },
								},
							},
						],
					},
				],
				page: { offset: 0, size: 1, pages: 69, items: 69 },
			},
			'make sure basic text lookup works',
		)
	},
	() => {
		const start = Date.now()
		const results = hunch({ index })({
			q: 'do not present your members',
			pageSize: 1,
			snippet: {
				'_chunks.content': 100,
			},
		})
		const duration = Date.now() - start
		assert.equal(
			results,
			{
				items: [
					{
						_id: 'romans/chapter-6.md',
						_score: 98.146,
						_chunks: [
							{
								name: 'markdown',
								content: 'should obey it in its lusts.  Also, do not present your members to sin as instruments of unrighteousnes',
								snippet: {
									content: { before: 1166, after: 1375 },
								},
							},
						],
					},
				],
				page: { offset: 0, size: 1, pages: 775, items: 775 },
			},
			'looking for long phrases',
		)
		assert.ok(duration < 1000, `approximate hard limit on time (duration=${duration})`)
	},
]
