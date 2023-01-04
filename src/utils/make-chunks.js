// These properties are necessary for MiniSearch to work, so if you
// have actual metadata with the same name we'll store it externally
// and recall it later.
const MINISEARCH_KEYS_TO_INTERNAL_KEYS = {
	content: '__content',
	id: '__id',
	match: '__match',
	score: '__score',
	terms: '__terms',
}

export const makeChunks = ({ files, searchableFields, verbose }) => {
	const chunkIdToFileIndex = {}
	const chunkMetadata = {}
	const fileToMetadata = {}

	const chunks = []
	let fileIndex = 0
	for (const { metadata, file, blocks } of files) {
		if (verbose) console.log('-', file, `(${blocks.length} chunks)`)
		let fileChunkIndex = 0
		// MiniSearch requires that searchable fields be duplicated across
		// chunks. The packing operation can minify it though.
		const duplicatedMetadata = {}
		if (metadata && Object.keys(metadata).length) {
			fileToMetadata[fileIndex] = {}
			for (const key in (metadata || {})) {
				if (searchableFields.includes(key)) duplicatedMetadata[key] = metadata[key]
				else fileToMetadata[fileIndex][key] = metadata[key]
			}
		}
		for (const { content, ...blockProps } of blocks) {
			const id = `${fileIndex}:${fileChunkIndex}`
			chunkIdToFileIndex[id] = fileIndex
			chunkMetadata[id] = blockProps
			chunks.push({
				...duplicatedMetadata,
				content: content,
				id,
			})
			fileChunkIndex++
		}
		fileIndex++
	}

	return {
		chunks,
		chunkIdToFileIndex,
		chunkMetadata,
		fileToMetadata,
	}
}
