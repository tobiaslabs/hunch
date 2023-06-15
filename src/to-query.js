const FACET_MATCHERS = {
	facetMustMatch: '',
	facetMustMatchAny: '~',
	facetMustNotMatch: '-',
}

/**
 * Given a HunchJS query parameter object, return a URL-safe string
 * containing those query parameters. For example:
 *
 *   { pageSize: 3, q: "why? because!", facetMustMatch: { tags: [ "cats", "dogs" ] } }
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
	if (query.includeFields?.length) out['include[fields]'] = query.includeFields.join(',')
	if (query.includeFacets?.length) out['include[facets]'] = query.includeFacets.join(',')
	if (query.includeMatches) out['include[matches]'] = ''

	if (Array.isArray(query.sort) && query.sort.length)
		out.sort = query.sort.map(({ key, descending }) => `${descending ? '-' : ''}${key}`).join(',')

	for (const shallowKey of [ 'q', 'fuzzy' ])
		if (query[shallowKey])
			out[shallowKey] = query[shallowKey].toString()

	for (const deepKey of [ 'boost', 'snippet' ])
		if (query[deepKey])
			for (const propKey in query[deepKey])
				out[`${deepKey}[${propKey}]`] = query[deepKey][propKey].toString()

	const addFacet = (facetName, value, prefix) => {
		const flatKey = `facets[${facetName}]`
		out[flatKey] = out[flatKey]
			? `${out[flatKey]},${prefix}${value}`
			: `${prefix}${value}`
	}
	for (const match in FACET_MATCHERS)
		if (query[match])
			for (const propKey in query[match])
				for (const value of query[match][propKey])
					addFacet(propKey, value.toString(), FACET_MATCHERS[match])

	let params = []
	for (const key of Object.keys(out).sort()) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(out[key])}`)
	return params.join('&')
}
