import { cwd as currentWorkingDirectory } from 'node:process'
import { join, dirname, isAbsolute, resolve } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import glob from 'tiny-glob'
import MiniSearch from 'minisearch'
import { parse } from '@saibotsivad/blockdown'
import { load, JSON_SCHEMA } from 'js-yaml'

const RESERVED_METADATA_KEYS = [
	'_content',
	'_file',
	'_id',
	// For some reason, even though specifying the ID field as `_id`, yet MiniSearch continues
	// to use `id`. This sure seems like a bug...
	'id',
	// this is some MiniSearch stuff here... I think I'll need to
	'match',
	'score',
	'terms',
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
		cwd,
		output,
		input: contentFolder,
		glob: globString,
		searchableFields,
		storedFields,
		stopWords,
		...remaining
	} = Object.assign({}, defaultOptions, options)

	if (!searchableFields?.length) searchableFields = []
	if (!storedFields?.length) storedFields = []

	if (stopWords && !Array.isArray(stopWords)) throw new Error('The option "stopWords" must be an array.')
	else stopWords = [ ...new Set(stopWords) ]

	if (!isAbsolute(contentFolder)) contentFolder = resolve(cwd || currentWorkingDirectory(), contentFolder)

	if (!output) throw new Error('Must specify an output filepath.')
	if (!isAbsolute(output)) output = resolve(cwd || currentWorkingDirectory(), output)
	await mkdir(dirname(output), { recursive: true })

	const metadataKeysToIndex = new Set()
	for (const field of searchableFields) metadataKeysToIndex.add(field)
	for (const field of (remaining.storeFields || [])) metadataKeysToIndex.add(field)
	for (const field of (remaining.facets || [])) metadataKeysToIndex.add(field)

	return {
		contentFolder,
		cwd,
		globString,
		metadataKeysToIndex: [ ...metadataKeysToIndex ],
		outputFilepath: output,
		searchableFields,
		storedFields,
		stopWords,
		...remaining,
	}
}

const pack = bundle => {
	for (const key in (bundle.index?.storedFields || {})) {
		if (bundle.index.storedFields[key]._file) bundle.index.storedFields[key]._file = bundle.files.findIndex(f => f === bundle.index.storedFields[key]._file)
	}
	return bundle
}

export const generate = async options => {
	let {
		facets,
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
		storedFields,
		verbose,
	} = await getOptionsAndSetupFolders(options)

	if (RESERVED_METADATA_KEYS.find(key => metadataKeysToIndex.includes(key))) throw new Error('Cannot index reserved metadata property names: ' + RESERVED_METADATA_KEYS.join(', '))

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

	// We store the additional fields outside the index, to not grow it too much, but
	// if the metadata is already in the index we don't store it.
	const fieldsToStore = (storedFields || []).filter(field => !metadataToFiles[field])
	const fileToStoredFields = {}
	if (fieldsToStore.length) for (const { _id: fileId, metadata } of files) {
		for (const field of fieldsToStore) if (metadata && metadata[field]) {
			fileToStoredFields[fileId] = fileToStoredFields[fileId] || {}
			fileToStoredFields[fileId][field] = metadata[field]
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
			...(facets || []),
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
		facets,
		files: filesList,
		// This forces the MiniSearch object to convert to a normal object, for pack traversal.
		index: JSON.parse(JSON.stringify(miniSearch)),
		metadata: metadataIndex,
		metadataToFiles,
		searchableFields,
		storedFieldKeys: storedFields,
		storedFields: fileToStoredFields,
	}), undefined, indent), 'utf8')
}
