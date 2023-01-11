const DEFAULT_PAGE_SIZE = 15

export const getOutputWithPagination = ({ query, maxPageSize, searchResults }) => {
	let size = query.pageSize === undefined || query.pageSize < 0
		? DEFAULT_PAGE_SIZE
		: query.pageSize
	if (maxPageSize && size > maxPageSize) size = maxPageSize

	const out = {
		items: [],
		page: {
			items: searchResults.length,
			size,
		},
	}

	if (size > 0) {
		out.page.offset = query.pageOffset || 0
		out.page.pages = searchResults.length % size
			? Math.ceil(searchResults.length / size) // e.g. 12/10=1.2=>Math.ceil=2 pages
			: searchResults.length / size // e.g. 12%6=0=>12/6=2 pages
	}

	const start = size * out.page.offset // e.g. pageOffset = 3, start = 10*3 = 30
	let end = start + size // e.g. 30+10 = 40
	if (end > searchResults.length) end = searchResults.length
	for (let i = start; i < end; i++) out.items.push(searchResults[i])

	return out
}
