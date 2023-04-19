import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { parse } from '@saibotsivad/blockdown'
import { load, JSON_SCHEMA } from 'js-yaml'

export const parseFile = async ({
	contentFolder: absoluteRootFilepath,
	file: relativeFilepath,
	normalizeMetadata,
	formatBlock,
}) => {
	const string = await readFile(join(absoluteRootFilepath, relativeFilepath), 'utf8')
	if (string) {
		let { blocks } = parse(string)
		let metadata = [ 'yaml', 'frontmatter' ].includes(blocks?.[0]?.name) && load(blocks[0].content, { schema: JSON_SCHEMA })
		if (blocks?.length > 1) blocks.shift()
		if (metadata && normalizeMetadata) metadata = await normalizeMetadata({ metadata, blocks })
		if (formatBlock) blocks = await Promise.all(blocks.map(block => formatBlock({ block })))
		return { metadata, file: relativeFilepath, blocks }
	}
}
