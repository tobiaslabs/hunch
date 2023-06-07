import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, '..', '..', 'build', 'save-file', 'content-basic')
await mkdir(outputDir, { recursive: true })

export default {
	saveFile: async ({ file, metadata, blocks /*, files, site */ }) => {
		await mkdir(join(outputDir, dirname(file)), { recursive: true })
		await writeFile(
			join(outputDir, `${file}.json`),
			JSON.stringify({ metadata, blocks }, undefined, '\t'),
			'utf8',
		)
	},
}
