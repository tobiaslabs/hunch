import { cwd as currentWorkingDirectory } from 'node:process'
import { isAbsolute, resolve } from 'node:path'
import glob from 'tiny-glob'
import MiniSearch from 'minisearch'

import { makeChunks } from './utils/make-chunks.js'
import { pack } from './utils/pack.js'
import { parseFile } from './utils/parse-file.js'

const DEFAULT_OPTIONS = {
	glob: '**/*.md',
	indent: null,
	preFilter: file => !file.endsWith('.DS_Store'),
	processedFilter: ({ metadata }) => metadata.published !== false && (!metadata.published?.getTime || metadata.published.getTime() > Date.now()),
	facets: [],
	searchableFields: [],
	storedFields: [],
}

export const generate = async options => {
	let {
		input: contentFolder,
		cwd,
		facets,
		glob: globString,
		normalizeMetadata,
		tokenizeBlockContent,
		preFilter,
		processedFilter,
		searchableFields,
		stopWords,
		storedFields,
		verbose,
		_minisearchOptions,
	} = Object.assign({}, DEFAULT_OPTIONS, options || {})

	if (stopWords && !Array.isArray(stopWords)) throw new Error('The option "stopWords" must be an array.')
	else if (stopWords) stopWords = [ ...new Set(stopWords) ]

	if (!isAbsolute(contentFolder)) contentFolder = resolve(cwd || currentWorkingDirectory(), contentFolder)

	console.log('Parsing all content files...')
	const files = await glob(globString, { cwd: contentFolder })
		.then(files => files.filter(preFilter))
		.then(files => Promise.all(
			files
				.sort() // to make id list deterministic, and for legibility in logs and files-list index
				.map((file, index) => parseFile({ contentFolder, file, index, normalizeMetadata, tokenizeBlockContent })),
		))
		.then(parsed => parsed.filter(processedFilter))
	if (verbose) for (const { file } of files) console.log('-', file)
	const filesList = files.map(f => f.file)
	console.log(`Parsed ${files.length} content files.`)

	console.log('Processing files.')
	const {
		chunks,
		chunkIdToFileIndex,
		chunkMetadata,
		fileToMetadata,
	} = makeChunks({ files, searchableFields, verbose })

	const validFacetValue = value => value === undefined
		|| typeof value === 'string'
		|| typeof value === 'number'
		|| (
			Array.isArray(value)
			&& value.every(v => typeof v === 'string' || typeof v === 'number')
		)
	if (facets?.length)
		for (const file of files)
			for (const facetKey of facets)
				if (!validFacetValue(file.metadata[facetKey])) {
					throw new Error('Faceted values must be primitive strings or numbers, or arrays containing only strings or numbers.')
				}

	_minisearchOptions = _minisearchOptions || {}
	_minisearchOptions.fields = _minisearchOptions.fields || [
		...new Set([
			...(searchableFields || []),
			...(facets || []),
			'content',
		]),
	].sort()
	// Since we eliminate all non-searched fields from the bundled data, we need
	// to make sure all searchable fields are stored.
	_minisearchOptions.storeFields = _minisearchOptions.storeFields || _minisearchOptions.fields
	if (verbose) {
		console.log('MiniSearch searchable fields:')
		for (const f of _minisearchOptions.fields) console.log('-', f)
	}
	console.log('Building search index.')
	const miniSearch = new MiniSearch(_minisearchOptions)
	miniSearch.addAll(chunks)

	return pack({
		// pass through configs
		facets,
		searchableFields,
		stopWords,
		storedFields,
		// generated data
		chunkIdToFileIndex,
		chunkMetadata,
		fileToMetadata,
		filesList,
		// minisearch index
		miniSearch,
		_minisearchOptions,
	})
}
