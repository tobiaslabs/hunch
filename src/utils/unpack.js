const unpackTree = (id, packed) => {
	const recursiveReplacer = obj => {
		let replace
		if (typeof obj === 'number') {
			replace = packed.values[obj]
		} else if (Array.isArray(obj)) {
			replace = []
			for (const elem of obj) replace.push(recursiveReplacer(elem))
		} else if (typeof obj === 'object') {
			replace = {}
			const objectKeyIndexes = Object.keys(obj)
			for (const keyIndex of objectKeyIndexes) {
				replace[packed.keys[keyIndex]] = recursiveReplacer(obj[keyIndex])
			}
		}
		return replace
	}
	return recursiveReplacer(packed.byId[id] || {})
}

/**
 * @typedef {Object} HunchBundleUnpacked
 * @property {Object<String,Number>} chunkIdToFileIndex - The chunk id, e.g. "3:1" to the file ID, e.g. 3.
 * @property {Object<String,Map<Any,Array<Number>>>} facets - The first key is the facet name, the next key is the metadata value.
 * @property {Object} fileIdToDocumentIds - Map of file ID, e.g. "3" to DocumentIDs, e.g. [ 7, 8 ], which are the chunks as MiniSearch documents.
 * @property {Array<String>} filesList - The list of all filenames.
 * @property {Function} getChunkMetadata - Given a document ID, e.g. "3:1", get the chunk metadata associated with it.
 * @property {Function} getFileMetadata - Given a fileId (a number) return the file metadata or an object.
 * @property {Object} miniSearch - The generated MiniSearch index.
 * @property {Array<String>} searchableFields - The list of fields available for searching.
 * @property {Object} _minisearchOptions - Options to pass to MiniSearch on restore.
 */

/**
 * Normalize aka unpack the Hunch bundle.
 * @param {HunchBundlePacked} bundle - The packed Hunch bundle.
 * @return {HunchBundleUnpacked} - The normalized bundle.
 */
export const unpack = ({
	// pass through configs
	facets,
	searchableFields,
	stopWords,
	// generated packed data
	chunkMetadata,
	fileIdToDocumentIds,
	fileMetadata,
	filesList,
	// minisearch related
	miniSearch,
	_minisearchOptions,
}) => {
	const unpacked = {
		chunkIdToFileIndex: {},
		fileIdToDocumentIds,
		filesList,
		miniSearch,
		searchableFields: searchableFields || [],
		_minisearchOptions: _minisearchOptions || {},
	}
	for (const fileId in fileIdToDocumentIds) unpacked.chunkIdToFileIndex[miniSearch.documentIds[fileIdToDocumentIds[fileId]]] = fileId

	if (stopWords?.length) {
		const words = new Set(stopWords)
		unpacked._minisearchOptions.processTerm = term => words.has(term) ? null : term.toLowerCase()
	}

	unpacked.facets = {}
	if (facets?.length) {
		for (const facetKey of facets) {
			unpacked.facets[facetKey] = new Map() // { key=Any : value=Array<FileId> }
			const fileMetadataKeyIndex = fileMetadata.keys.findIndex(k => k === facetKey)
			for (const fileId in fileMetadata.byId) {
				let valueIndexes = fileMetadata.byId[fileId][fileMetadataKeyIndex]
				if (!Array.isArray(valueIndexes)) valueIndexes = [ valueIndexes ]
				for (const valueIndex of valueIndexes) {
					const list = unpacked.facets[facetKey].get(fileMetadata.values[valueIndex]) || []
					list.push(fileId)
					unpacked.facets[facetKey].set(fileMetadata.values[valueIndex], list)
				}
			}
		}
	}

	// We unpack the metadata lazily, to reduce cold-start times, but cache it
	// for future requests.
	const inMemoryFileMetadataCache = {}
	unpacked.getFileMetadata = fileId => {
		if (!inMemoryFileMetadataCache[fileId]) {
			const { content: ignore, ...overallFields } = miniSearch.storedFields[fileIdToDocumentIds[fileId][0]] || {}
			inMemoryFileMetadataCache[fileId] = {
				...unpackTree(fileId, fileMetadata),
				...overallFields,
			}
		}
		return { ...inMemoryFileMetadataCache[fileId] } // shallow copy
	}
	const inMemoryChunkMetadataCache = {}
	unpacked.getChunkMetadata = chunkId => {
		if (!inMemoryChunkMetadataCache[chunkId]) inMemoryChunkMetadataCache[chunkId] = unpackTree(chunkId, chunkMetadata)
		return { ...inMemoryChunkMetadataCache[chunkId] } // shallow copy
	}

	return unpacked
}
