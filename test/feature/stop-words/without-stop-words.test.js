export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'archery and sport',
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 4.596, _content: '\narchery and sport\n' },
					{ _id: 'file2.md', _score: 1.136, _content: '\narchery sport\n' },
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'does not suggest "march" since not same prefix',
		)
	},
]
