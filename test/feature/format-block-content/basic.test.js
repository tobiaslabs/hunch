export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'cats',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.51,
						title: 'file1',
						_chunk: { name: 'markdown', content: 'cats with markdown' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'find the markdown content of the blockdown backwards-compatible first block',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'clever',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.51,
						title: 'file1',
						_chunk: { name: 'markdown', content: 'very clever words' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'find the markdown content of the second block',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'fizz',
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 1.402,
						title: 'file1',
						_chunk: {
							name: 'yaml',
							content: 'foo bar fizz buzz',
							metadata: {
								original: '\nfoo: bar\nfizz:\n  - buzz\n',
								parsed: {
									foo: 'bar',
									fizz: [ 'buzz' ],
								},
							},
						},
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'find the YAML block with the original and parsed data',
		)
	},
]
