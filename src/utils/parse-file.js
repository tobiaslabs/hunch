import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { parse } from '@saibotsivad/blockdown'
import { load, JSON_SCHEMA } from 'js-yaml'

export const parseFile = async ({
	contentFolder: absoluteRootFilepath,
	file: relativeFilepath,
	formatMetadata,
	formatBlockMetadata,
	yamlOptions,
}) => {
	const string = await readFile(join(absoluteRootFilepath, relativeFilepath), 'utf8')
	if (string) {
		let { blocks } = parse(string)
		let metadata = [ 'yaml', 'frontmatter' ].includes(blocks?.[0]?.name)
			&& load(blocks[0].content, { schema: JSON_SCHEMA, ...(yamlOptions || {}) })
		if (blocks?.length > 1) blocks.shift()
		if (metadata && formatMetadata) metadata = await formatMetadata({ metadata, blocks })
		if (formatBlockMetadata) blocks = (
			await Promise.all(blocks.map(
				block => formatBlockMetadata({ block, file: relativeFilepath, metadata, blocks })
					.then(m => {
						block.metadata = m
						return block
					}),
			))
		).flat().filter(Boolean)
		return { metadata, file: relativeFilepath, blocks }
	}
}
