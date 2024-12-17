import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { parse } from '@saibotsivad/blockdown'
import { load, JSON_SCHEMA } from 'js-yaml'
import { logger } from './logger.js'

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
		if (metadata && formatMetadata) {
			try {
				metadata = await formatMetadata({ metadata, blocks })
			} catch (error) {
				logger.error(`Error while formatting file metadata in ${JSON.stringify(relativeFilepath)}`, metadata)
				throw error
			}
		}
		if (formatBlockMetadata) blocks = (
			await Promise.all(blocks.map(
				block => formatBlockMetadata({ block, file: relativeFilepath, metadata, blocks })
					.catch(error => {
						logger.error(`Error while formatting block metadata in ${JSON.stringify(relativeFilepath)}`, block)
						throw error
					})
					.then(m => {
						block.metadata = m
						return block
					}),
			))
		).flat().filter(Boolean)
		return { metadata, file: relativeFilepath, blocks }
	}
}
