export default (assert, search) => {
	assert.equal(
		search({ q: 'present' }),
		{
			items: [
				{ _id: 'file1.md', _content: '\nwords only present in file1\n' },
				{ _id: 'file2.md', _content: '\nwords only present in file2 next part shared with file3\n' },
			],
			page: { number: 0, size: 25, total: 2 },
			aggregations: {},
		},
		'only two files have "present"',
	)
	assert.equal(
		search({ q: 'words only present in' }),
		{
			items: [
				{ _id: 'file1.md', _content: '\nwords only present in file1\n' },
				{ _id: 'file2.md', _content: '\nwords only present in file2 next part shared with file3\n' },
			],
			page: { number: 0, size: 25, total: 2 },
			aggregations: {},
		},
		'only two files have the full phrase',
	)
	assert.equal(
		search({ q: 'next part shared with' }),
		{
			items: [
				{ _id: 'file2.md', _content: '\nwords only present in file2 next part shared with file3\n' },
				{ _id: 'file3.md', _content: '\nthis is file3 next part shared with file2\n' },
			],
			page: { number: 0, size: 25, total: 2 },
			aggregations: {},
		},
		'only two files have the full phrase',
	)
}
