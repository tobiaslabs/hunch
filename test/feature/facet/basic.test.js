export default (assert, search) => [
	() => {
		assert.equal(
			search({
				q: 'words',
				facetInclude: { tags: [ 'cats' ] },
			}),
			{
				items: [
					{ _id: 'file1.md', _score: 0.158, _content: '\nwords in file1\n', tags: [ 'cats', 'dogs' ] },
					{ _id: 'file2.md', _score: 0.158, _content: '\nwords in file2\n', tags: [ 'cats' ] },
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
				facets: {
					tags: {
						dogs: 1,
						cats: 2,
					},
				},
			},
			'two files have cats',
		)
	},
	() => {
		assert.equal(
			search({
				q: 'words',
				facetInclude: { tags: [ 'cats' ] },
				facetExclude: { tags: [ 'dogs' ] },
			}),
			{
				items: [
					{ _id: 'file2.md', _score: 0.158, _content: '\nwords in file2\n', tags: [ 'cats' ] },
				],
				page: { offset: 0, size: 15, pages: 1, items: 1 },
				facets: {
					tags: {
						cats: 1,
					},
				},
			},
			'only one files has cats and NOT dogs',
		)
	},
]
