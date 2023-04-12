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
			'find the content of the first chunk',
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
			'find the content of the second chunk',
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
						_chunk: { name: 'yaml', content: 'foo bar fizz buzz' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
			},
			'find the content of the third chunk',
		)
	},
]
