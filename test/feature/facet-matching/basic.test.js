export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'words',
				facetMustMatch: { tags: [ 'cats' ] },
			}),
			{
				items: [
					{
						_id: 'file1.md',
						_score: 0.158,
						tags: [ 'cats', 'dogs' ],
						title: 'file1',
						_chunk: { name: 'markdown', content: '\nwords in file1\n' },
					},
					{
						_id: 'file2.md',
						_score: 0.158,
						tags: [ 'cats' ],
						title: 'file2',
						_chunk: { name: 'markdown', content: '\nwords in file2\n' },
					},
				],
				page: { items: 2, offset: 0, pages: 1, size: 15 },
				facets: {
					tags: {
						dogs: { all: 2, search: 1 },
						cats: { all: 2, search: 2 },
					},
				},
			},
			'two files have cats',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'words',
				facetMustMatch: { tags: [ 'cats' ] },
				facetMustNotMatch: { tags: [ 'dogs' ] },
			}),
			{
				items: [
					{
						_id: 'file2.md',
						_score: 0.158,
						tags: [ 'cats' ],
						title: 'file2',
						_chunk: { name: 'markdown', content: '\nwords in file2\n' },
					},
				],
				page: { items: 1, offset: 0, pages: 1, size: 15 },
				facets: {
					tags: {
						cats: { all: 2, search: 1 },
					},
				},
			},
			'only one files has cats and NOT dogs',
		)
	},
	() => {
		assert.equal(
			hunch({ index })({
				q: 'words',
				facetMustMatch: { field_that_does_not_exist: [ 'yolo' ] },
			}),
			{
				items: [],
				page: { items: 0, offset: 0, pages: 0, size: 15 },
			},
			'only one files has cats and NOT dogs',
		)
	},
]
