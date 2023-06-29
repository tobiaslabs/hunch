import { toText } from 'hast-util-to-text'

export const finalizeRecord = async ({ file, metadata, blocks }) => ({
	file,
	metadata,
	blocks: metadata.search !== false && blocks
		.filter(block => [ 'md', 'markdown' ].includes(block.name))
		.map(({ name, id, metadata, data: hastTree }) => {
			return { name, id, metadata, content: toText(hastTree) }
		}),
})
