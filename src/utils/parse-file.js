import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { parse } from '@saibotsivad/blockdown'
import { load, JSON_SCHEMA } from 'js-yaml'

export const parseFile = async ({ contentFolder: absoluteRootFilepath, file: relativeFilepath, normalizeMetadata, tokenizeBlockContent }) => {
	const string = await readFile(join(absoluteRootFilepath, relativeFilepath), 'utf8')
	if (string) {
		let { blocks } = parse(string)
		let metadata = [ 'yaml', 'frontmatter' ].includes(blocks?.[0]?.name) && load(blocks[0].content, { schema: JSON_SCHEMA })
		if (blocks?.length > 1) blocks.shift()
		if (metadata && normalizeMetadata) metadata = await normalizeMetadata({ metadata, blocks })
		// tokenization of blocks occurs after metadata normalization
		if (tokenizeBlockContent) blocks = await Promise
			.all(blocks.map(block => tokenizeBlockContent(block, metadata)))
		return { metadata, file: relativeFilepath, blocks }
	}
}
