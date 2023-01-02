export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'archery and sport',
			}),
			{
				items: [
					{ _id: 'file2.md', _score: 1.136, _content: '\narchery sport\n' },
					{ _id: 'file1.md', _score: 1.056, _content: '\narchery and sport\n' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'does not suggest "march" since not same prefix',
		)
	},
]
