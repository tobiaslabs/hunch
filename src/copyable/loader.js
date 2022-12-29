import { dirname, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export const loadAllFiles = async ({ filesList }) => {
	const contentFolder = join(dirname(fileURLToPath(import.meta.url)), 'file')
	const promises = []
	for (let i = 0; i < filesList.length; i++) {
		promises.push(
			readFile(join(contentFolder, `${i}.json`), 'utf8')
				.then(string => JSON.parse(string))
				.then(data => {
					data._id = i
					return data
				}),
		)
	}
	return Promise.all(promises)
}
