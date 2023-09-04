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
						_score: 6.164,
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
				page: { offset: 0, size: 1, pages: 73, items: 73 },
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
						_score: 90.282,
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
				page: { offset: 0, size: 1, pages: 1057, items: 1057 },
			},
			'looking for long phrases',
		)
		assert.ok(duration < 2000, `approximate hard limit on time (duration=${duration})`)
	},
]
