import { pick } from './pick.js'

export const finalizeRecord = async ({ file, metadata, blocks /* site, files */ }) => {
	blocks = blocks
		.filter(block => block?.content)
		.map(block => pick(block, [ 'name', 'id', 'content', 'metadata' ]))

	// return falsey to remove whole record from search
	return blocks.length > 0 && {
		file,
		metadata,
		blocks,
	}
}
