import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, '..', '..', 'build', 'save-file', 'content-basic')

export default ({ assert }) => [
	async () => {
		const file1 = JSON.parse(await readFile(join(outputDir, 'file1.md.json'), 'utf8'))
		assert.equal(
			file1,
			{
				metadata: {
					title: 'file1',
				},
				blocks: [
					{
						name: 'markdown',
						content: '\nfile1 content\n',
						data: '\nfile1 content\n',
					},
				],
			},
			'the file was saved as expected',
		)
	},
	async () => {
		const file2 = JSON.parse(await readFile(join(outputDir, 'folder', 'file2.md.json'), 'utf8'))
		assert.equal(
			file2,
			{
				metadata: {
					title: 'file2',
				},
				blocks: [
					{
						name: 'markdown',
						content: '\nfile2 content\n',
						data: '\nfile2 content\n',
					},
				],
			},
			'the deeper file was saved as expected',
		)
	},
]
