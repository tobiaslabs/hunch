export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({ q: 'present' }),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 0.768,
						title: 'file1',
						_chunks: [ { name: 'markdown', content: '\nwords only present in file1\n' } ],
					},
					{
						_id: 'file2.md',
						_score: 0.661,
						title: 'file2',
						_chunks: [ {
							name: 'markdown',
							content: '\nwords only present in file2 next part shared with file3\n',
						} ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'only two files have "present"',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({ q: 'words only present in' }),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 12.281,
						title: 'file1',
						_chunks: [ { name: 'markdown', content: '\nwords only present in file1\n' } ],
					},
					{
						_id: 'file2.md',
						_score: 10.579,
						title: 'file2',
						_chunks: [ {
							name: 'markdown',
							content: '\nwords only present in file2 next part shared with file3\n',
						} ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'only two files have the full phrase',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({ q: 'next part shared with' }),
			{
				items: [
					{
						_id: 'file3.md',
						_score: 11.171,
						title: 'file3',
						_chunks: [ {
							name: 'markdown',
							content: '\nthis is file3 next part shared with file2\n',
						} ],
					},
					{
						_id: 'file2.md',
						_score: 10.579,
						title: 'file2',
						_chunks: [ {
							name: 'markdown',
							content: '\nwords only present in file2 next part shared with file3\n',
						} ],
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
			},
			'only two files have the full phrase',
		)
	},
]
