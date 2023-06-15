import MiniSearch from 'minisearch'

import { unpack } from './utils/unpack.js'
import { snipContent } from './utils/snip-content.js'
import { getOutputWithPagination } from './utils/pagination.js'
import { filterForMatchingPhrases } from './utils/filter-for-matching-phrases.js'

const EMPTY_RESULTS = {
	items: [],
	page: {
		items: 0,
		offset: 0,
		pages: 0,
	},
}

const shouldExitEarlyForEmptySet = ({ query, facets, searchableFields }) => {
	if (query.boost)
		for (const key in query.boost)
			if (!facets[key] && !searchableFields.includes(key)) return true
	if (query.facetInclude)
		for (const key in query.facetInclude)
			if (!facets[key]) return true
			else if (!query.facetInclude[key].find(f => facets[key].get(f))) return true
}

const filterDocuments = (searchResults, query) => {
	const mustAll = query.facetMustMatch || {}
	const mustAny = query.facetMustMatchAny || {}
	const mustNot = query.facetMustNotMatch || {}
	return searchResults.filter(document => {
		for (const name in mustAll) {
			if (!document[name]) return false
			else for (const value of mustAll[name]) {
				if (Array.isArray(document[name])) {
					if (!document[name].includes(value)) return false
				} else if (document[name] !== value) {
					return false
				}
			}
		}

		for (const name in mustNot)
			for (const value of mustNot[name]) {
				if (Array.isArray(document[name])) {
					if (document[name].includes(value)) return false
				} else if (document[name] === value) {
					return false
				}
			}

		for (const name in mustAny)
			for (const value of mustAny[name]) {
				if (Array.isArray(document[name])) {
					if (document[name].includes(value)) return true
				} else if (document[name] === value) {
					return true
				}
			}

		// The must-any short circuits true if any are
		// found, so if we're here it didn't short circuit
		// and therefore we just need to make sure that
		// there aren't any must-any keys required.
		return !Object.keys(mustAny).length
	})
}

const defaultPrePaginationSort = ({ items, query }) => {
	return query?.sort?.length
		? items.sort((a, b) => {
			for (const { key, descending } of query.sort) {
				// Ascending: 'aaa'.localeCompare('bbb') === 1
				// Descending: 'bbb'.localeCompare('aaa') === 1
				const sorted = ((descending ? b : a)[key] || '').toString().localeCompare(((descending ? a : b)[key] || '').toString())
				if (sorted !== 0) return sorted
			}
			return 0
		})
		: items
}

const removeFieldsNotIncluded = (items, includedFields) => items.map(item => {
	const out = { _id: item._id }
	for (const field of includedFields) if (item[field] !== undefined) out[field] = item[field]
	return out
})

export const hunch = ({ index: bundledIndex, sort: prePaginationSort, maxPageSize }) => {
	if (!prePaginationSort) prePaginationSort = defaultPrePaginationSort

	const {
		chunkIdToFileIndex,
		facets,
		fileIdToDocumentIds,
		filesList,
		getChunkMetadata,
		getFileMetadata,
		miniSearch,
		searchableFields,
		_minisearchOptions,
	} = unpack(bundledIndex)

	let mini
	const init = () => mini = MiniSearch.loadJS(miniSearch, _minisearchOptions)

	return query => {
		// If for example you specify a `facetInclude` value and there are no documents
		// containing that value, we can just short circuit and exit early.
		if (shouldExitEarlyForEmptySet({ query, facets, searchableFields })) return EMPTY_RESULTS

		if (query.id) {
			let item = null
			const fileId = filesList.indexOf(query.id)
			const documentIds = fileIdToDocumentIds[fileId]
			if (documentIds) {
				const chunks = []
				for (const id of documentIds) chunks.push({
					...getChunkMetadata(miniSearch.documentIds[id]),
					content: miniSearch.storedFields[id].content,
				})
				if (chunks.length) item = {
					...getFileMetadata(fileId),
					_id: query.id,
					_chunks: chunks,
				}
			}
			return { item }
		}

		let searchResults = []

		if (!mini && (query.q || query.suggest)) init()

		if (query.suggest) {
			return {
				suggestions: mini
					.autoSuggest(query.q || '')
					.map(({ suggestion: q, score }) => ({
						q,
						score: Math.round(score * 1000) / 1000,
					})),
			}
		} else if (query.q) {
			const miniOptions = {}
			// These few properties are named exactly the same as
			// the MiniSearch properties, so we can direct copy.
			for (const key of [ 'boost', 'fields', 'fuzzy', 'prefix' ]) if (query[key]) miniOptions[key] = query[key]
			searchResults = mini.search(query.q, miniOptions)
			if (query.q.includes('"') || query.q.includes("'")) searchResults = filterForMatchingPhrases(query.q, searchResults)
		} else {
			// loading *all* documents, but only the first chunk
			for (const documentId in miniSearch.documentIds) {
				searchResults.push({
					...miniSearch.storedFields[documentId],
					id: miniSearch.documentIds[documentId],
				})
			}
		}

		if (!searchResults.length) return EMPTY_RESULTS

		// The results from MiniSearch may match more than one chunk, and if that happens we
		// want to limit the returned items so that if there are multiple chunks in a
		// single file, it doesn't fill the facet bucket with only the one file.
		//
		// This is a novel approach, and it may be misguided--splitting into chunks adds a
		// significant amount of complexity to the search algorithm. I would appreciate any
		// feedback, if you use this functionality.
		//
		// In any case, if you don't use multi-chunk documents, the results will be the same: the
		// list of documents, de-duped by "parent" ID, using the highest scoring chunk.
		const parentIdToChunkId = {}
		const chunkIdToKeep = {}
		for (const result of searchResults) {
			const id = chunkIdToFileIndex[result.id]
			// for MiniSearch, the first one is the highest scoring, so we just always grab that one
			if (!parentIdToChunkId[id]) {
				parentIdToChunkId[id] = true
				chunkIdToKeep[result.id] = true
			}
		}
		searchResults = searchResults
			.filter(r => chunkIdToKeep[r.id])
			.map(({ id, score, content, ...props }) => {
				const metadata = getFileMetadata(chunkIdToFileIndex[id])
				if (score) metadata._score = Math.round(score * 1000) / 1000
				return snipContent(query, {
					...props,
					...metadata,
					_id: filesList[chunkIdToFileIndex[id]],
					_chunks: [ {
						...(getChunkMetadata(id) || {}),
						content,
					} ],
				})
			})

		if (query.facetMustMatch || query.facetMustNotMatch || query.facetMustMatchAny) searchResults = filterDocuments(searchResults, query)

		searchResults = prePaginationSort({ items: searchResults, query })
		if (query.includeFields?.length) searchResults = removeFieldsNotIncluded(searchResults, query.includeFields)

		const outputFacets = {}
		const addToFacets = (facet, key, add) => {
			outputFacets[facet] = outputFacets[facet] || {}
			outputFacets[facet][key] = outputFacets[facet][key] || {
				all: facets[facet]?.get?.(key)?.length || 0,
				search: 0,
			}
			if (add) outputFacets[facet][key].search += add
		}

		// If the query requests to include specific facets, we need to
		// add the overall counts.
		if (query.includeFacets?.includes('*')) {
			for (const facet in facets)
				for (const key of facets[facet].keys()) addToFacets(facet, key)
		} else if (query.includeFacets?.length) {
			for (const facet of query.includeFacets)
				for (const key of facets[facet].keys()) addToFacets(facet, key)
		}

		// Then, we need to set the search-result facet counts, before we
		// limit the search results through pagination.
		const facetNames = query.includeFacets?.length && !query.includeFacets.includes('*')
			? query.includeFacets.filter(f => facets[f])
			: Object.keys(facets)
		if (facetNames?.length)
			for (let item of searchResults)
				for (const f of facetNames)
					if (item[f]) {
						if (Array.isArray(item[f])) for (const p of item[f]) addToFacets(f, p, 1)
						else addToFacets(f, item[f], 1)
					}

		const out = getOutputWithPagination({ query, maxPageSize, searchResults })
		if (Object.keys(outputFacets).length) out.facets = outputFacets
		return out
	}
}
