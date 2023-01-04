export default (assert, search) => [
	() => {
		assert.equal(
			search({ id: 'file_that_does_not_exist.md' }),
			{ item: null },
			'getting a file that does not exist',
		)
	},
	() => {
		assert.equal(
			search({ id: 'file1.md' }),
			{
				item: {
					podcastId: 123,
					tags: [ 'cats', 'dogs' ],
					title: 'title of file1',
					_id: 'file1.md',
					_chunks: [
						{
							name: 'markdown',
							content: '\nwords in file1\n',
						},
					],
				},
			},
			'getting a file that *does* exist',
		)
	},
]
