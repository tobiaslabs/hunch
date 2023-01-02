export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'cooler than cool',
			}),
			{
				items: [
					{ _id: 'file2.md', _score: 7.165, _content: '\nwhat is cooler than cool other than cool itself?\n' },
					{ _id: 'file1.md', _score: 0.328, _content: '\ncool\n' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'different scores',
		)
	},
]
