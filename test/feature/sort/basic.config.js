export default {
	facets: [ 'series' ],
}

export const setup = {
	sort: ({ items, query }) => {
		return query.sort === 'series'
			? items.sort((a, b) => (a.series || '').localeCompare(b.series || ''))
			: items
	},
}
