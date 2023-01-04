import MiniSearch from 'minisearch'

import { unpack } from './utils/unpack.js'

const DEFAULT_PAGE_SIZE = 15
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
	const include = query.facetInclude || {}
	const exclude = query.facetExclude || {}
	return searchResults.filter(document => {
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
	})
}

export const hunch = ({ index: bundledIndex, sort: prePaginationSort, maxPageSize }) => {
	const {
		chunkIdToFileIndex,
		chunkMetadata,
		facets,
		fileIdToDocumentIds,
		fileMetadata,
		filesList,
		getChunkMetadata,
		getFileMetadata,
		searchableFields,
		// storedFields,
		// fileIndexToMetadata,
		// fileIndexToSearchChunkIndexes,
		// metadataKeyToMultiValue,
		// metadataToFileIndexes,
		// searchChunkIdToChunkMetadata,

		// minisearch index
		miniSearch,
		_minisearchOptions,
	} = unpack(bundledIndex)

	let mini
	const init = () => mini = MiniSearch.loadJS(miniSearch, _minisearchOptions)

	return query => {
		// If for example you specify `facet[tags]=cats` and there are no documents
		// containing that tag, we can just short circuit and exit early.
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
			.map(({ terms: ignore1, match: ignore2, id, score, content, ...props }) => {
				const metadata = getFileMetadata(chunkIdToFileIndex[id])
				if (score) metadata._score = Math.round(score * 1000) / 1000
				return {
					...props,
					...metadata,
					_id: filesList[chunkIdToFileIndex[id]],
					_chunk: {
						...(getChunkMetadata(id) || {}),
						content,
					},
				}
			})

		if (query.facetInclude || query.facetExclude) searchResults = filterDocuments(searchResults, query)

		if (prePaginationSort) searchResults = prePaginationSort({ items: searchResults, query })

		let size = query.pageSize === undefined || query.pageSize < 0
			? DEFAULT_PAGE_SIZE
			: query.pageSize
		if (maxPageSize && size > maxPageSize) size = maxPageSize
		const out = {
			items: [],
			page: size === 0
				? { items: searchResults.length }
				: {
					items: searchResults.length,
					offset: query.pageOffset || 0,
					pages: searchResults.length % size
						? Math.round(searchResults.length / size) + 1 // e.g. 12/10=1.2=>Math.round=1=>+1=2 pages
						: searchResults.length / size, // e.g. 12%6=0=>12/6=2 pages
					size,
				},
		}
		const addToFacets = (facet, key) => {
			out.facets = out.facets || {}
			out.facets[facet] = out.facets[facet] || {}
			out.facets[facet][key] = (out.facets[facet][key] || 0) + 1
		}

		const start = size * out.page.offset // e.g. pageOffset = 3, start = 10*3 = 30
		const end = start + size // e.g. 30+10 = 40
		let index = 0
		const facetNames = Object.keys(facets)
		for (let item of searchResults) {
			if (facetNames?.length)
				for (const f of facetNames)
					if (item[f]) {
						if (Array.isArray(item[f])) for (const p of item[f]) addToFacets(f, p)
						else addToFacets(f, item[f])
					}
			if (index >= start && index < end)
				out.items.push(item)
			index++
		}

		return out
	}
}
