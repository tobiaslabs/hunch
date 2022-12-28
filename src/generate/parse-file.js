import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { parse } from '@saibotsivad/blockdown'
import { load, JSON_SCHEMA } from 'js-yaml'

export const parseFile = async ({ contentFolder: absoluteRootFilepath, file: relativeFilepath, normalizeMetadata }) => {
	const string = await readFile(join(absoluteRootFilepath, relativeFilepath), 'utf8')
	if (string) {
		const { blocks } = parse(string)
		let metadata = [ 'yaml', 'frontmatter' ].includes(blocks?.[0]?.name) && load(blocks[0].content, { schema: JSON_SCHEMA })
		if (metadata) metadata = normalizeMetadata(metadata)
		if (blocks?.length > 1) blocks.shift()
		if (blocks?.length > 1) throw new Error('Unexpected multi-block content! ' + relativeFilepath)
		// TODO generate html... think about this better...
		const html = 'TODO generate using noddity stuff'
		const text = 'TODO from html->text without markdown aka searchable'
		// TODO `id` should be from filename???
		return { metadata, file: relativeFilepath, blocks }
	}
}
