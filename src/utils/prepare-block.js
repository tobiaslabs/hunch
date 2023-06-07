export const prepareBlock = async (block /*, { file, metadata, blocks, site, files } */) => {
	// return hast || undefined to remove block from search
	return block.content
}
