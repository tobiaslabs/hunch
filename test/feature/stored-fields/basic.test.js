export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'words',
			}),
			{
				items: [
					// file 1 is published=false
					{ _id: 'file2.md', _score: 0.273, _content: '\nwords in file2\n', tags: [ 'dogs' ], podcastId: 123 },
					{ _id: 'file3.md', _score: 0.273, _content: '\nwords in file3\n', tags: [ 'cats', 'dogs' ], podcastId: 456 },
				],
				page: { offset: 0, size: 15, count: 1 },
				facets: {
					tags: {
						dogs: 2,
						cats: 1,
					},
				},
			},
			'stored fields retained but note that "published" not retained, you need to set it!',
		)
	},
]
