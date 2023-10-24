// // These properties are necessary for MiniSearch to work, so if you
// // have actual metadata with the same name we'll store it externally
// // and recall it later.
// const MINISEARCH_KEYS_TO_INTERNAL_KEYS = {
// 	content: '__content',
// 	id: '__id',
// 	match: '__match',
// 	score: '__score',
// 	terms: '__terms',
// }

const packTree = (initialKeys, initialValues, rootAllowedKeys) => {
	const keys = initialKeys || []
	const values = initialValues || []
	const byId = {}
	const recursiveReplacer = (obj, restrictedKeys) => {
		let replace
		if (Array.isArray(obj)) {
			replace = []
			for (const elem of obj) {
				replace.push(recursiveReplacer(elem))
			}
		} else if (typeof obj === 'object' && obj !== null) {
			replace = {}
			const objectKeys = restrictedKeys || Object.keys(obj)
			for (const key of objectKeys)
				if (obj[key] !== undefined) {
					let keyIndex = keys.findIndex(k => k === key)
					if (keyIndex < 0) {
						keyIndex = keys.length
						keys.push(key)
					}
					replace[keyIndex] = recursiveReplacer(obj[key])
				}
		} else if (obj !== undefined) {
			let valueIndex = values.findIndex(v => v === obj)
			if (valueIndex < 0) {
				valueIndex = values.length
				values.push(obj)
			}
			return valueIndex
		}
		return replace
	}
	return {
		add: (id, obj) => {
			const val = recursiveReplacer(obj, rootAllowedKeys)
			if (val !== undefined) byId[id] = val
		},
		done: () => ({ keys, values, byId }),
	}
}
/** @typedef {Object} HunchBundlePacked
 * // pass through configs
 * @property {Object} facets
 * @property {Object} searchableFields
 * @property {Object} stopWords
 * // generated packed data
 * @property {Object} chunkMetadata
 * @property {Object} fileIdToDocumentIds
 * @property {Object} fileMetadata
 * @property {Object} filesList
 * // minisearch related
 * @property {Object} miniSearch
 * @property {Object} _minisearchOptions
 */

/**
 * @return {HunchBundlePacked} The packed bundle.
 */
export const pack = ({
	// pass through configs
	facets,
	searchableFields,
	stopWords,
	storedFields,
	// generated data
	chunkIdToFileIndex,
	chunkMetadata,
	fileToMetadata,
	filesList,
	// minisearch index
	miniSearch,
	_minisearchOptions,
}) => {
	const packed = {
		// pass through configs
		facets,
		searchableFields,
		filesList,
		// stringify forces the MiniSearch object to convert to
		// a normal object for normal traversal
		miniSearch: JSON.parse(JSON.stringify(miniSearch)),
		_minisearchOptions,
	}

	if (stopWords) packed.stopWords = [ ...new Set(stopWords) ]

	const chunkIdToDocumentId = {}
	for (const documentId in packed.miniSearch.documentIds) chunkIdToDocumentId[packed.miniSearch.documentIds[documentId]] = documentId
	packed.fileIdToDocumentIds = {}
	for (const chunkId in chunkIdToFileIndex) {
		const fileId = chunkIdToFileIndex[chunkId]
		packed.fileIdToDocumentIds[fileId] = packed.fileIdToDocumentIds[fileId] || []
		packed.fileIdToDocumentIds[fileId].push(chunkIdToDocumentId[chunkId])
	}

	const packedChunkMetadata = packTree()
	for (const chunkId in chunkMetadata) packedChunkMetadata.add(chunkId, chunkMetadata[chunkId])
	packed.chunkMetadata = packedChunkMetadata.done()

	const savedMetadataFields = new Set()
	for (const f of (storedFields || [])) savedMetadataFields.add(f)
	for (const f of (facets || [])) savedMetadataFields.add(f)

	const packedFileMetadata = packTree([ ...savedMetadataFields ], [], [ ...savedMetadataFields ])
	for (const fileId in fileToMetadata) packedFileMetadata.add(fileId, fileToMetadata[fileId])
	packed.fileMetadata = packedFileMetadata.done()

	return packed
}
