import { sep, join, dirname, isAbsolute, resolve } from 'node:path'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import glob from 'tiny-glob'
import MiniSearch from 'minisearch'

import { parseFile } from './generate/parse-file.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const RESERVED_METADATA_KEYS = [
	'id',
	'_id',
	'_content',
	'_file',
]

const defaultOptions = {
	glob: '**/*.md',
	indent: null,
	metadataKeysToIndex: [ 'tags' ],
	normalizeMetadata: _ => _,
	preFilter: file => !file.endsWith('.DS_Store'),
	processedFilter: ({ metadata }) => metadata.published !== false && (!metadata.published?.getTime || metadata.published.getTime() > Date.now()),
}

const getOptionsAndSetupFolders = async (options) => {
	let {
		buildFolder,
		contentFolder,
		glob: globString,
		indent,
		searchableFields,
		stopWords,
		...remaining
	} = Object.assign({}, defaultOptions, options)

	if (!searchableFields?.length) searchableFields = []

	if (stopWords && !Array.isArray(stopWords)) throw new Error('The option "stopWords" must be an array!')
	else stopWords = [ ...new Set(stopWords) ]

	if (!isAbsolute(contentFolder)) contentFolder = resolve(process.cwd(), contentFolder)
	if (!isAbsolute(buildFolder)) buildFolder = resolve(process.cwd(), buildFolder)
	const indexDirectory = join(buildFolder, 'index')
	await mkdir(indexDirectory, { recursive: true })
	const fileDirectory = join(buildFolder, 'file')
	await mkdir(fileDirectory, { recursive: true })

	return {
		buildFolder,
		contentFolder,
		fileDirectory,
		indexDirectory,
		globString,
		searchableFields,
		stopWords,
		writeJson: async (filepath, obj) => writeFile(filepath, JSON.stringify(obj, undefined, indent), 'utf8'),
		...remaining,
	}
}

const humanTime = millis => {
	// numbers picked to look nice-enough
	if (millis < 1_000) return `${millis} milliseconds`
	if (millis < 120_000) return `${Math.round(millis / 100) / 10} seconds` // 113_456 => '113.5' seconds
	else return `${Math.round(millis / 6000) / 10} minutes` // 4_567_890 => '76.1 minutes'
}

export const searchmd = async options => {
	const start = Date.now()
	let {
		aggregations,
		buildFolder,
		contentFolder,
		fileDirectory,
		globString,
		indexDirectory,
		metadataKeysToIndex,
		minisearchOptions,
		normalizeMetadata,
		preFilter,
		processedFilter,
		searchableFields,
		stopWords, // TODO
		writeJson,
		verbose,
	} = await getOptionsAndSetupFolders(options)

	if (RESERVED_METADATA_KEYS.find(key => metadataKeysToIndex.includes(key))) throw new Error('Cannot index reserved metadata property names: ' + RESERVED_METADATA_KEYS.join(', '))

	await copyFile(join(__dirname, 'copyable', 'search.js'), join(buildFolder, 'search.js'))
	await writeJson(join(indexDirectory, 'configurations.json'), { aggregations, searchableFields })

	console.log('Parsing all content files...')
	const files = await glob(globString, { cwd: contentFolder })
		.then(files => files.filter(preFilter))
		.then(files => Promise.all(
			files
				.sort() // to make id list deterministic, and for legibility in logs and files-list index
				.map((file, index) => parseFile({ contentFolder, file, index, normalizeMetadata })),
		))
		.then(parsed => parsed.filter(processedFilter))
		.then(filtered => filtered.map((f, index) => {
			f._id = index.toString()
			return f
		}))
	if (verbose) for (const { file } of files) console.log('-', file)

	const filesList = files.map(f => f.file)
	await writeJson(join(indexDirectory, 'files-list.json'), filesList)
	if (verbose) console.log('Wrote files list to:', join(indexDirectory, 'files-list.json'))

	console.log(`Parsed ${files.length} content files and wrote files list.`)
	const metadataToFiles = {}
	const addToMainIndex = (key, value, file) => {
		metadataToFiles[key] = metadataToFiles[key] || {}
		metadataToFiles[key][value] = metadataToFiles[key][value] || new Set()
		metadataToFiles[key][value].add(filesList.indexOf(file))
	}
	for (const { file, metadata } of files) {
		for (const key of metadataKeysToIndex) {
			if (Array.isArray(metadata[key])) {
				for (const value of metadata[key]) addToMainIndex(key, value, file)
			} else if (metadata[key]) addToMainIndex(key, metadata[key], file)
		}
	}
	for (const key in metadataToFiles)
		for (const value in metadataToFiles[key])
			metadataToFiles[key][value] = [ ...metadataToFiles[key][value] ]
	await writeJson(join(indexDirectory, 'metadata-to-files.json'), metadataToFiles)
	const metadataIndex = {}
	for (const key in metadataToFiles) for (const value in metadataToFiles[key]) {
		metadataIndex[key] = metadataIndex[key] || []
		metadataIndex[key].push(value)
	}
	for (const key in metadataIndex) metadataIndex[key] = metadataIndex[key].sort()
	await writeJson(join(indexDirectory, 'metadata.json'), metadataIndex)
	if (verbose) {
		console.log('Metadata values generated:')
		for (const key in metadataToFiles) {
			console.log('-', key)
			for (const value in metadataToFiles[key]) console.log('  -', value, metadataToFiles[key][value].length)
		}
		console.log('Wrote metadata index to:', join(indexDirectory, 'metadata.json'))
		console.log('Wrote metadata values to:', join(indexDirectory, 'metadata-to-files.json'))
	} else console.log('Metadata values generated and saved.')

	if (verbose) console.log('Writing all file chunks and metadata:')
	const chunks = []
	for (const { _id: fileId, metadata, file, blocks } of files) {
		if (verbose) console.log('-', fileId, file)

		let blockIndex = -1
		for (const b of blocks) b._id = `${fileId}:${++blockIndex}`
		await writeJson(join(fileDirectory, `${fileId}.json`), { metadata, blocks })

		for (const { _id: chunkId, content } of blocks) {
			chunks.push({
				...metadata,
				_file: file,
				_id: chunkId,
				_content: content,
			})
		}
	}
	if (verbose) console.log('Content files written to:', fileDirectory)
	else console.log('Content files written.')

	const fields = [
		...new Set([
			...(searchableFields || []),
			...Object.keys(aggregations || {}),
			'_content',
			'_file',
		]),
	].sort()
	if (verbose) {
		console.log('MiniSearch searchable fields are:')
		for (const f of fields) console.log('-', f)
	}
	const miniSearch = new MiniSearch({
		...(minisearchOptions || {}),
		fields,
		idField: '_id',
		storeFields: fields,
	})
	miniSearch.addAll(chunks)
	await writeJson(join(indexDirectory, 'minisearch.json'), miniSearch)

	console.log(`SearchMD completed in ${humanTime(Date.now() - start)}.`)
}
