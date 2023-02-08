/**
 * Given a HunchJS query parameter object, return a URL-safe string
 * containing those query parameters. For example:
 *
 *   { pageSize: 3, q: "why? because!", facetInclude: { tags: [ "cats", "dogs" ] } }
 *   =>
 *   "page%5Bsize%5D=3&q=why%3F%20because!&facets%5Btags%5D=cats%2Cdogs"
 *
 * @param {QueryParameters} query - The normalized parameters.
 * @return {String} - The parameters cast to a HunchJS query string.
 */
export const toQuery = query => {
	const out = {}
	if (query.id) out.id = query.id.toString()
	if (query.pageSize !== undefined) out['page[size]'] = query.pageSize.toString()
	if (query.pageOffset !== undefined) out['page[offset]'] = query.pageOffset.toString()
	if (query.prefix) out.prefix = 'true'
	if (query.suggest) out.suggest = 'true'
	if (query.fields?.length) out.fields = query.fields.join(',')

	if (Array.isArray(query.sort) && query.sort.length)
		out.sort = query.sort.map(({ key, descending }) => `${descending ? '-' : ''}${key}`).join(',')

	for (const shallowKey of [ 'q', 'fuzzy' ])
		if (query[shallowKey])
			out[shallowKey] = query[shallowKey].toString()

	for (const deepKey of [ 'boost', 'snippet' ])
		if (query[deepKey])
			for (const propKey in query[deepKey])
				out[`${deepKey}[${propKey}]`] = query[deepKey][propKey].toString()

	const addFacet = (facetName, value, exclude) => {
		const flatKey = `facets[${facetName}]`
		const prefix = exclude ? '-' : ''
		out[flatKey] = out[flatKey]
			? `${out[flatKey]},${prefix}${value}`
			: `${prefix}${value}`
	}
	for (const deepKey of [ 'facetInclude', 'facetExclude' ])
		if (query[deepKey])
			for (const propKey in query[deepKey])
				addFacet(propKey, query[deepKey][propKey].toString(), deepKey === 'facetExclude')

	let params = []
	for (const key of Object.keys(out).sort()) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(out[key])}`)
	return params.join('&')
}
