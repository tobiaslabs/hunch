export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'words',
			}),
			{
				items: [
					// file 1 is published=false
					{
						_id: 'file2.md',
						_score: 0.273,
						started: '2022-12-01',
						title: 'file2',
						tags: [ 'dogs' ],
						podcastId: 123,
						_chunk: { name: 'markdown', content: '\nwords in file2\n' },
					},
					{
						_id: 'file3.md',
						_score: 0.273,
						title: 'file3',
						tags: [ 'cats', 'dogs' ],
						podcastId: 456,
						_chunk: { name: 'markdown', content: '\nwords in file3\n' },
					},
				],
				page: { offset: 0, size: 15, pages: 1, items: 2 },
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
