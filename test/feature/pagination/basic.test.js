const item1 = {
	_id: 'file1.md',
	_score: 0.158,
	title: 'file1',
	_chunks: [ { name: 'markdown', content: '\ncool\n' } ],
}
const item2 = {
	_id: 'file2.md',
	_score: 0.158,
	title: 'file2',
	_chunks: [ { name: 'markdown', content: '\ncool\n' } ],
}
const item3 = {
	_id: 'file3.md',
	_score: 0.158,
	title: 'file3',
	_chunks: [ { name: 'markdown', content: '\ncool\n' } ],
}
const item4 = {
	_id: 'file4.md',
	_score: 0.158,
	title: 'file4',
	_chunks: [ { name: 'markdown', content: '\ncool\n' } ],
}

const maxPageSize = 3

export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index, maxPageSize })({
				q: 'cool',
			}),
			{
				items: [
					item1,
					item2,
					item3,
				],
				page: { items: 4, offset: 0, pages: 2, size: 3 },
			},
			'results without pagination limited by max page size',
		)
	},
	() => {
		assert.equal(
			hunch({ index, maxPageSize })({
				q: 'cool',
				pageSize: 2,
			}),
			{
				items: [
					item1,
					item2,
				],
				page: { items: 4, offset: 0, pages: 2, size: 2 },
			},
			'set page size to see different pagination output',
		)
	},
	() => {
		assert.equal(
			hunch({ index, maxPageSize })({
				q: 'cool',
				pageSize: 2,
				pageOffset: 1,
			}),
			{
				items: [
					item3,
					item4,
				],
				page: { items: 4, offset: 1, pages: 2, size: 2 },
			},
			'page size and offset',
		)
	},
	() => {
		assert.equal(
			hunch({ index, maxPageSize })({
				q: 'cool',
				pageSize: 100,
			}),
			{
				items: [
					item1,
					item2,
					item3,
				],
				page: { items: 4, offset: 0, pages: 2, size: 3 },
			},
			'attempting to go over max page size fails',
		)
	},
]
