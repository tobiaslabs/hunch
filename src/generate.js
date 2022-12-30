import { join, dirname, isAbsolute, resolve } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import glob from 'tiny-glob'
import MiniSearch from 'minisearch'
import { parse } from '@saibotsivad/blockdown'
import { load, JSON_SCHEMA } from 'js-yaml'

const RESERVED_METADATA_KEYS = [
	'id',
	'_id',
	'_content',
	'_file',
]

const defaultOptions = {
	glob: '**/*.md',
	indent: null,
	normalizeMetadata: _ => _,
	preFilter: file => !file.endsWith('.DS_Store'),
	processedFilter: ({ metadata }) => metadata.published !== false && (!metadata.published?.getTime || metadata.published.getTime() > Date.now()),
}

const parseFile = async ({ contentFolder: absoluteRootFilepath, file: relativeFilepath, normalizeMetadata }) => {
	const string = await readFile(join(absoluteRootFilepath, relativeFilepath), 'utf8')
	if (string) {
		const { blocks } = parse(string)
		let metadata = [ 'yaml', 'frontmatter' ].includes(blocks?.[0]?.name) && load(blocks[0].content, { schema: JSON_SCHEMA })
		if (metadata) metadata = normalizeMetadata(metadata)
		if (blocks?.length > 1) blocks.shift()
		// TODO generate html... think about this better...
		const html = 'TODO generate using noddity stuff'
		const text = 'TODO from html->text without markdown aka searchable'
		// TODO `id` should be from filename???
		return { metadata, file: relativeFilepath, blocks }
	}
}

const getOptionsAndSetupFolders = async (options) => {
	let {
		output,
		input: contentFolder,
		glob: globString,
		searchableFields,
		stopWords,
		...remaining
	} = Object.assign({}, defaultOptions, options)

	if (!searchableFields?.length) searchableFields = []

	if (stopWords && !Array.isArray(stopWords)) throw new Error('The option "stopWords" must be an array.')
	else stopWords = [ ...new Set(stopWords) ]

	if (!isAbsolute(contentFolder)) contentFolder = resolve(process.cwd(), contentFolder)

	if (!output) throw new Error('Must specify an output filepath.')
	if (!isAbsolute(output)) output = resolve(process.cwd(), output)
	await mkdir(dirname(output), { recursive: true })

	const metadataKeysToIndex = new Set()
	for (const field of searchableFields) metadataKeysToIndex.add(field)
	for (const field of (remaining.storeFields || [])) metadataKeysToIndex.add(field)
	for (const field in (remaining.aggregations || {})) metadataKeysToIndex.add(field)

	return {
		contentFolder,
		globString,
		metadataKeysToIndex: [ ...metadataKeysToIndex ],
		outputFilepath: output,
		searchableFields,
		stopWords,
		...remaining,
	}
}

const humanTime = millis => {
	// numbers picked to look nice-enough
	if (millis < 1_000) return `${millis} milliseconds`
	if (millis < 120_000) return `${Math.round(millis / 100) / 10} seconds` // 113_456 => '113.5' seconds
	else return `${Math.round(millis / 6000) / 10} minutes` // 4_567_890 => '76.1 minutes'
}

const pack = bundle => {
	for (const key in (bundle.index?.storedFields || {})) {
		if (bundle.index.storedFields[key]._file) bundle.index.storedFields[key]._file = bundle.files.findIndex(f => f === bundle.index.storedFields[key]._file)
	}
	return bundle
}

export const generate = async options => {
	const start = Date.now()
	let {
		aggregations,
		contentFolder,
		globString,
		indent,
		metadataKeysToIndex,
		minisearchOptions,
		normalizeMetadata,
		outputFilepath,
		preFilter,
		processedFilter,
		searchableFields,
		stopWords, // TODO
		verbose,
	} = await getOptionsAndSetupFolders(options)

	if (RESERVED_METADATA_KEYS.find(key => metadataKeysToIndex.includes(key))) throw new Error('Cannot currently index reserved metadata property names: ' + RESERVED_METADATA_KEYS.join(', '))

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
	const metadataIndex = {}
	for (const key in metadataToFiles) for (const value in metadataToFiles[key]) {
		metadataIndex[key] = metadataIndex[key] || []
		metadataIndex[key].push(value)
	}
	for (const key in metadataIndex) metadataIndex[key] = metadataIndex[key].sort()

	console.log('Metadata values generated.')
	if (verbose) {
		for (const key in metadataToFiles) {
			console.log('-', key)
			for (const value in metadataToFiles[key]) console.log('  -', value, metadataToFiles[key][value].length)
		}
	}

	console.log('Processing files.')
	const chunks = []
	for (const { _id: fileId, metadata, file, blocks } of files) {
		if (verbose) console.log('-', fileId, file)
		let blockIndex = -1
		for (const b of blocks) b._id = `${fileId}:${++blockIndex}`
		for (const { _id: chunkId, content } of blocks) {
			chunks.push({
				...metadata,
				_file: file,
				_id: chunkId,
				_content: content,
			})
		}
	}

	const fields = [
		...new Set([
			...(searchableFields || []),
			...Object.keys(aggregations || {}),
			'_content',
			'_file',
		]),
	].sort()
	if (verbose) {
		console.log('MiniSearch searchable fields:')
		for (const f of fields) console.log('-', f)
	}
	console.log('Building search index.')
	const miniSearch = new MiniSearch({
		...(minisearchOptions || {}),
		fields,
		idField: '_id',
		storeFields: fields,
	})
	miniSearch.addAll(chunks)

	console.log('Writing data to disk.')
	await writeFile(outputFilepath, JSON.stringify(pack({
		aggregations,
		files: filesList,
		// This forces the MiniSearch object to convert to a normal object, for pack traversal.
		index: JSON.parse(JSON.stringify(miniSearch)),
		metadata: metadataIndex,
		metadataToFiles,
		searchableFields,
	}), undefined, indent), 'utf8')

	console.log(`Hunch completed in ${humanTime(Date.now() - start)}.`)
}
