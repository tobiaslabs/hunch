const BRACKETED_QUERY_PARAM = /([^[]+)\[([^\]]+)]/

const castToObject = p => {
	const obj = {}
	for (const c of p.keys()) obj[c] = p.get(c)
	return obj
}

const castToInt = (params, key) => {
	const value = parseInt(params[key], 10)
	if (Number.isNaN(value) || value < 0) throw new Error(`The parameter "${key}" must be an integer greater or equal to zero.`)
	return value
}

const castToBoolean = (params, key) => {
	if (params[key] === 'true') return true
	else if (params[key] && params[key] !== 'false') throw new Error(`The parameter "${key}" must only be "true" or "false".`)
}

const castToUniqueStrings = string => ([
	...new Set(string.split(',').map(f => f.trim())),
])

/**
 * @typedef {Object} QueryParameters
 * @param {string} [q] - The text to search for.
 * @param {string} [id] - The identifier of the document.
 * @param {number} [fuzzy] - The fuzziness of the main query parameter. (Float. Default: none.)
 * @param {boolean} [prefix] - Whether to use the query string as a prefix.
 * @param {boolean} [suggest] - Whether to use the query string to suggest other search queries.
 * @param {Array<string>}} [fields] - The fields to search within.
 * @param {Any} [sort] - The sort property passed to the pre-pagination sort function.
 * @param {number} [pageOffset] - The zero-index number of pagination offsets to use in the search. (Integer. Default: none)
 * @param {number} [pageSize] - The number of items per pagination. (Integer. Default: none)
 * @param {Object<string,number>} [boost] - The metadata key to boost by some value greater than 1. (Float. Default: 1)
 * @param {Object<string,Array<string>>} [facetInclude] - Constrain the search results to records containing metadata with exact values.
 * @param {Object<string,Array<string>>} [facetExclude] - Constrain the search results to records that does notcontaining metadata with exact values.
 */

/**
 * Given a query parameter object (for example a `URLSearchParams` object), return a
 * normalized set of query parameters for use by the Hunch engine.
 *
 * @param {URLSearchParams|Object} params - The query parameters.
 * @return {QueryParameters} - The normalized parameters.
 */
export const fromQuery = params => {
	params = params || {}
	if (params instanceof URLSearchParams) params = castToObject(params)

	const parsed = {}

	if (params.q) parsed.q = params.q
	if (params.id) parsed.id = params.id

	if (params.fuzzy) parsed.fuzzy = parseFloat(params.fuzzy)
	if (parsed.fuzzy < 0) throw new Error('The parameter "fuzzy" must be a positive number.')

	if (params.prefix) parsed.prefix = castToBoolean(params, 'prefix')
	if (params.suggest) parsed.suggest = castToBoolean(params, 'suggest')

	if (params.fields) parsed.fields = castToUniqueStrings(params.fields)

	if (params.sort !== undefined) parsed.sort = params.sort

	if (params['page[offset]']) parsed.pageOffset = castToInt(params, 'page[offset]')
	if (params['page[size]']) parsed.pageSize = castToInt(params, 'page[size]')

	for (const key in params) {
		const [ , parent, child ] = (key.endsWith(']') && BRACKETED_QUERY_PARAM.exec(key)) || []
		if (parent === 'boost') {
			parsed.boost = parsed.boost || {}
			parsed.boost[child] = parseFloat(params[key])
			if (Number.isNaN(parsed.boost[child]) || parsed.boost[child] < 1) throw new Error(`The parameter "${key}" must be a valid float greater than 1.`)
		} else if (parent === 'snippet') {
			parsed.snippet = parsed.snippet || {}
			parsed.snippet[child] = castToInt(params, key)
		} else if (parent === 'facets') {
			const values = castToUniqueStrings(params[key])
			for (const val of values) {
				if (val[0] === '-') {
					parsed.facetExclude = parsed.facetExclude || {}
					parsed.facetExclude[child] = parsed.facetExclude[child] || []
					parsed.facetExclude[child].push(val.substring(1))
				} else {
					parsed.facetInclude = parsed.facetInclude || {}
					parsed.facetInclude[child] = parsed.facetInclude[child] || []
					parsed.facetInclude[child].push(val)
				}
			}
		}
	}

	return parsed
}