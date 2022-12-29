import MiniSearch from 'minisearch'
import ItemsJS from 'itemsjs'

import configurations from './index/configurations.json' assert { type: 'json' }
const { aggregations, searchableFields } = configurations
import metadataToFiles from './index/metadata-to-files.json' assert { type: 'json' }
import minisearchIndex from './index/minisearch.json' assert { type: 'json' }

const BRACKETED_QUERY_PARAM = /([^[]+)\[([^\]]+)]/
const castToPositiveInt = (params, key) => {
	const value = parseInt(params[key], 10)
	if (Number.isNaN(value) || value <= 0) throw new Error(`The parameter "${key}" must be a positive integer.`)
	return value
}
const castToBoolean = (params, key) => {
	if (params[key] === 'true') return true
	else if (params[key] && params[key] !== 'false') throw new Error(`The parameter "${key}" must only be "true" or "false".`)
}
const castToUniqueStrings = string => ([
	...new Set(string.split(',').map(f => f.trim())),
])

const generateItemsJsChunks = () => {
	const chunks = []
	let index = 0
	for (const id in minisearchIndex.storedFields) {
		const documentId = minisearchIndex.documentIds[id]
		const { _content, ...metadata } = minisearchIndex.storedFields[id]
		chunks.push({
			...metadata,
			_id: documentId,
			_content,
		})
	}
	return chunks
}

/**
 * @typedef {Object} QueryParameters
 * @param {string} [q] - The text to search for.
 * @param {number} [fuzzy] - The fuzziness of the main query parameter. (Float. Default: none.)
 * @param {boolean} [prefix] - Whether to use the query string as a prefix.
 * @param {boolean} [suggest] - Whether to use the query string to suggest other search queries.
 * @param {Array<string>}} [fields] - The fields to search within.
 * @param {Array<string>}} [sort] - The fields to use for sorting.
 * @param {number} [pageNumber] - The number of pagination offsets to use in the search. (Integer. Default: none)
 * @param {number} [pageSize] - The number of pages per pagination. (Integer. Default: Infinity)
 * @param {Object<string,number>} [boost] - The metadata key to boost by some value greater than 1. (Float. Default: 1)
 * @param {Object<string,Array<string>>} [facetInclude] - Constrain the search results to records containing metadata with exact values.
 * @param {Object<string,Array<string>>} [facetExclude] - Constrain the search results to records that does notcontaining metadata with exact values.
 */

const MINISEARCH_KEYS_TO_COPY = [
	'fuzzy',
	'prefix',
	'fields',
]

/**
 * @param {Object} params - The query parameters.
 * @return {QueryParameters} - The normalized parameters.
 */
const normalizeAndValidateQueryStringParameters = params => {
	const parsed = {}

	if (params.q) parsed.q = params.q

	if (params.fuzzy) parsed.fuzzy = parseFloat(params.fuzzy)
	if (parsed.fuzzy < 0) throw new Error('The parameter "fuzzy" must be a positive number.')

	if (params.prefix) parsed.prefix = castToBoolean(params, 'prefix')
	if (params.suggest) parsed.suggest = castToBoolean(params, 'suggest')

	if (params.fields) parsed.fields = castToUniqueStrings(params.fields)
	if (params.sort) parsed.sort = castToUniqueStrings(params.sort)

	if (params['page[number]']) parsed.pageNumber = castToPositiveInt(params['page[number]'])
	if (params['page[size]']) parsed.pageSize = castToPositiveInt(params['page[size]'])

	for (const key in params) {
		const [ , parent, child ] = (key.endsWith(']') && BRACKETED_QUERY_PARAM.exec(key)) || []
		if (parent === 'boost') {
			parsed.boost = parsed.boost || {}
			parsed.boost[child] = parseFloat(params[key])
			if (Number.isNaN(parsed.boost[child]) || parsed.boost[child] < 1) throw new Error(`The parameter "${key}" must be a valid float greater than 1.`)
		} else if (parent === 'facet') {
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

const exitEarlyForEmptySet = (params) => {
	if (params.boost)
		for (const key in params.boost)
			if (!metadataToFiles[key]) return true
	if (params.facet)
		for (const key in params.facet)
			if (!metadataToFiles[key]) return true
			else if (!params.facet[key].find(f => metadataToFiles[key][f])) return true
}

const filterDocuments = params => {
	const include = params.facetInclude || {}
	const exclude = params.facetExclude || {}
	return document => {
		let matches = true
		for (const name in include) {
			if (!document[name]) matches = false
			else for (const value of include[name]) {
				if (Array.isArray(document[name])) {
					if (!document[name].includes(value)) matches = false
				} else if (document[name] !== value) {
					matches = false
				}
			}
		}
		for (const name in exclude) for (const value of exclude[name]) {
			if (Array.isArray(document[name])) {
				if (document[name].includes(value)) matches = false
			} else if (document[name] === value) {
				matches = false
			}
		}
		return matches
	}
}

let initializationMillis
let items
let mini
let chunkIdToItemsJsId
let itemsJsIdToChunkId

export const search = async ({ queryStringParameters, normalizedParameters }) => {
	if (!normalizedParameters) normalizedParameters = normalizeAndValidateQueryStringParameters(queryStringParameters || {})

	// If for example you specify `facet[tags]=cats` and there are no documents
	// containing that tag, we can just short circuit and exit early.
	if (exitEarlyForEmptySet(normalizedParameters)) return { results: [], normalizedParameters }

	if (!initializationMillis) {
		const start = Date.now()
		console.log('Initializing ItemsJS.')
		const chunks = generateItemsJsChunks()
		chunkIdToItemsJsId = {}
		itemsJsIdToChunkId = {}
		chunks.forEach((chunk, index) => {
			chunkIdToItemsJsId[chunk._id] = index + 1
			itemsJsIdToChunkId[index + 1] = chunk._id
		})
		items = ItemsJS(chunks, {
			native_search_enabled: false,
			custom_id_field: '_id',
			aggregations,
		})
		console.log('Initializing MiniSearch.')
		const fields = [
			...new Set([
				...(searchableFields || []),
				...Object.keys(aggregations || {}),
				'_file',
				'_content',
			]),
		]
		mini = MiniSearch.loadJS(minisearchIndex, {
			idField: '_id',
			fields,
			storeFields: fields,
		})
		initializationMillis = (Date.now() - start) || -1
		console.log(`Search indexed after ${initializationMillis} milliseconds.`)
	}

	const miniOptions = {}
	if (normalizedParameters.facetInclude || normalizedParameters.facetExclude) {
		miniOptions.filter = filterDocuments(normalizedParameters)
	}

	for (const key of MINISEARCH_KEYS_TO_COPY)
		if (normalizedParameters[key]) miniOptions[key] = normalizedParameters[key]
	let searchResults = mini.search(normalizedParameters.q, miniOptions)
	const originalSearchResultsCount = searchResults.length

	const documentIdToScore = {}
	for (const result of searchResults) {
		const id = result.id.split(':')[0]
		if (!documentIdToScore[id] || documentIdToScore[id].score < result.score) documentIdToScore[id] = result
	}
	searchResults = Object.values(documentIdToScore)

	console.log(`MiniSearch found search results in ${searchResults.length} documents (across ${originalSearchResultsCount} chunks).`)

	const results = items.search({
		per_page: 1,
		custom_id_field: '_id',
		ids: searchResults.map(s => chunkIdToItemsJsId[s.id]),
	})
	results.data.items = (results.data.items || []).map(item => {
		// TODO figure out the id here
		// item._id = item.__id
		// delete item.__id
		return item
	})
	return {
		results,
		initializationMillis,
		params: normalizedParameters,
	}
}
