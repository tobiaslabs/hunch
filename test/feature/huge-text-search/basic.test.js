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
								content: 'u should obey it in its lusts.  Also, do not present your members to sin as instruments of unrighteo',
								snippet: {
									content: { start: 1264, size: 2644 },
								},
							},
						],
					},
				],
				page: { offset: 0, size: 1, pages: 69, items: 2 },
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
								content: 'hould obey it in its lusts.  Also, do not present your members to sin as instruments of unrighteousn',
								snippet: {
									content: { start: 1267, size: 2644 },
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
