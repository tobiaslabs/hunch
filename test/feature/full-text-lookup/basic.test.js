export default (assert, search) => [
	() => {
		assert.equal(
			search({ q: 'present' }),
			{
				items: [
					{ _id: 'file1.md', _score: 0.768, _content: '\nwords only present in file1\n' },
					{ _id: 'file2.md', _score: 0.661, _content: '\nwords only present in file2 next part shared with file3\n' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'only two files have "present"',
		)
	},
	() => {
		assert.equal(
			search({ q: 'words only present in' }),
			{
				items: [
					{ _id: 'file1.md', _score: 12.281, _content: '\nwords only present in file1\n' },
					{ _id: 'file2.md', _score: 10.579, _content: '\nwords only present in file2 next part shared with file3\n' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'only two files have the full phrase',
		)
	},
	() => {
		assert.equal(
			search({ q: 'next part shared with' }),
			{
				items: [
					{ _id: 'file3.md', _score: 11.171, _content: '\nthis is file3 next part shared with file2\n' },
					{ _id: 'file2.md', _score: 10.579, _content: '\nwords only present in file2 next part shared with file3\n' },
				],
				page: { offset: 0, size: 15, count: 1 },
			},
			'only two files have the full phrase',
		)
	},
]
