import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { prepareBlock } from './prepare-block.js'
import { finalizeRecord } from './finalize-record.js'
import { createNoddityMicromarkRenderer } from './noddity-micromark-renderer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CONTENT_DIR = join(__dirname, '..', 'feature', 'huge-text-search', 'content-basic')
const SITE_DATA = { websiteDomain: 'site.com' }

const renderer = createNoddityMicromarkRenderer({ noddityDirectory: CONTENT_DIR, websiteDomain: SITE_DATA.websiteDomain })
for (const key in renderer) {
	const original = renderer[key]
	renderer[key] = async (...args) => {
		try {
			return await original(...args)
		} catch (error) {
			console.error('Failure for Noddity renderer.', key, args, error)
			throw error
		}
	}
}

export default {
	input: '../feature/huge-text-search/content-basic',
	output: './build/hunch.json',
	glob: '**/*.md',
	facets: [ 'book' ],
	prepareFilesData: async () => ({ renderer }),
	prepareBlock,
	finalizeRecord,
}
