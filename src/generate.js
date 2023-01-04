import { cwd as currentWorkingDirectory } from 'node:process'
import { dirname, isAbsolute, resolve } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import glob from 'tiny-glob'
import MiniSearch from 'minisearch'

import { makeChunks } from './utils/make-chunks.js'
import { pack } from './utils/pack.js'
import { parseFile } from './utils/parse-file.js'

const DEFAULT_OPTIONS = {
	glob: '**/*.md',
	indent: null,
	normalizeMetadata: _ => _,
	preFilter: file => !file.endsWith('.DS_Store'),
	processedFilter: ({ metadata }) => metadata.published !== false && (!metadata.published?.getTime || metadata.published.getTime() > Date.now()),
	// TODO document these defaults
	facets: [
		'tags',
		'tag',
		'categories',
		'category',
	],
	searchableFields: [
		'content',
		'description',
		'summary',
		'title',
	],
	storedFields: [
		'published',
		'updated',
	],
}

export const generate = async options => {
	let {
		input: contentFolder,
		cwd,
		facets,
		glob: globString,
		indent,
		normalizeMetadata,
		output: outputFilepath,
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

	// TODO move out to CLI tool
	if (!outputFilepath) throw new Error('Must specify an output filepath.')
	if (!isAbsolute(outputFilepath)) outputFilepath = resolve(cwd || currentWorkingDirectory(), outputFilepath)
	await mkdir(dirname(outputFilepath), { recursive: true })

	console.log('Parsing all content files...')
	const files = await glob(globString, { cwd: contentFolder })
		.then(files => files.filter(preFilter))
		.then(files => Promise.all(
			files
				.sort() // to make id list deterministic, and for legibility in logs and files-list index
				.map((file, index) => parseFile({ contentFolder, file, index, normalizeMetadata })),
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

	// TODO pass back pre-stringify and stringify+write to disk in CLI
	console.log('Writing data to disk.')
	await writeFile(outputFilepath, JSON.stringify(pack({
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
	}), undefined, indent), 'utf8')
}
