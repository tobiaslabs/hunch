import MiniSearch from 'minisearch'
import ItemsJS from 'itemsjs'

const shouldExitEarlyForEmptySet = (metadataToFiles, params) => {
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

const remapItemsResults = ({ pagination, data: { items, aggregations } }) => {
	for (const key in (aggregations || {})) {
		delete aggregations[key].name
		for (const bucket of (aggregations[key].buckets || [])) {
			bucket.count = bucket.doc_count
			delete bucket.doc_count
			delete bucket.selected
		}
	}
	for (const item of items) {
		item._id = item._file
		delete item._file
	}
	return {
		items, // TODO need to remap each item probably
		page: {
			number: pagination.page - 1, // ItemsJS uses a 1-index
			size: pagination.per_page,
			total: pagination.total,
		},
		aggregations,
	}
}

const generateItemsJsChunks = minisearchIndex => {
	const chunks = []
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

const unpack = bundle => {
	for (const key in (bundle?.index?.storedFields || {})) {
		bundle.index.storedFields[key]._file = bundle.files[bundle.index.storedFields[key]._file]
	}
	bundle.chunks = generateItemsJsChunks(bundle.index)
	return bundle
}

export const hunch = ({ data }) => {
	const {
		aggregations,
		chunks,
		index,
		metadata,
		metadataToFiles,
		searchableFields,
	} = unpack(data)

	let items
	let mini
	let chunkIdToItemsJsId
	let itemsJsIdToChunkId
	const init = () => {
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
		mini = MiniSearch.loadJS(index, {
			idField: '_id',
			fields,
			storeFields: fields,
		})
	}

	return query => {
		// If for example you specify `facet[tags]=cats` and there are no documents
		// containing that tag, we can just short circuit and exit early.
		if (shouldExitEarlyForEmptySet(metadataToFiles, query)) return { results: [] }

		if (!items || !mini) init()

		const miniOptions = {}
		if (query.facetInclude || query.facetExclude) miniOptions.filter = filterDocuments(query)

		// These few properties are named exactly the same as
		// the MiniSearch properties, so we direct copy.
		for (const key of [ 'fuzzy', 'prefix', 'fields' ]) if (query[key]) miniOptions[key] = query[key]

		// The results from MiniSearch may match more than one chunk, and if that happens we
		// want to limit the IDs passed to ItemsJS so that if there are multiple chunks in a
		// single file, it doesn't fill the aggregation bucket with only the one file.
		//
		// This is a novel approach, and it may be misguided--splitting into chunks adds a
		// significant amount of complexity to the search algorithm. I would appreciate any
		// feedback, if you use this functionality.
		//
		// In any case, if you don't use multi-chunk documents, the results will be the same: the
		// list of IDs to pass to ItemsJS.
		let searchResults = mini.search(query.q, miniOptions)
		const documentIdToItems = {}
		for (const result of searchResults) {
			const id = result.id.split(':')[0]
			documentIdToItems[id] = documentIdToItems[id] || []
			// first one is the highest score (for MiniSearch)
			documentIdToItems[id].push(result)
		}
		const itemsIds = []
		for (const documentId in documentIdToItems) itemsIds.push(chunkIdToItemsJsId[documentIdToItems[documentId][0].id])

		return remapItemsResults(
			items.search({
				per_page: 1,
				custom_id_field: '_id',
				ids: itemsIds,
				// TODO specify aggregations etc here
			}),
		)
	}
}
