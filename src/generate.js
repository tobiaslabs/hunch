import { isAbsolute, resolve } from 'node:path'
import { cwd as currentWorkingDirectory } from 'node:process'
import MiniSearch from 'minisearch'
import glob from 'tiny-glob'

import { finalizeRecord } from './utils/finalize-record.js'
import { makeChunks } from './utils/make-chunks.js'
import { pack } from './utils/pack.js'
import { parseFile } from './utils/parse-file.js'
import { prepareBlock } from './utils/prepare-block.js'
import { logger } from './utils/logger.js'

const DEFAULT_OPTIONS = {
	facets: [],
	filterFile: ({ metadata }) => metadata.published !== false
		&& (!metadata.published?.getTime || metadata.published.getTime() > Date.now()),
	finalizeRecord,
	prepareBlock,
	glob: '**/*.md',
	indent: null,
	searchableFields: [],
	storedFields: [],

	// This filter is basically anything that is *excessively* obvious that it will
	// never be a content file. Consumers should be able to immediately update this
	// implementation, so it's not a big deal, just want to make sure defaults are sane.
	preFilter: file => !file.endsWith('.DS_Store'),
}

export const generate = async options => {
	let {
		input: contentFolder,
		cwd,
		facets,
		glob: globString,
		finalizeRecord,
		formatMetadata,
		formatBlockMetadata,
		preFilter,
		prepareFilesData,
		prepareBlock,
		filterFile,
		mergeMetadata,
		searchableFields,
		saveSite,
		stopWords,
		storedFields,
		verbose,
		saveFile,
		yamlOptions,
		_minisearchOptions,
	} = Object.assign({}, DEFAULT_OPTIONS, options || {})

	if (stopWords && !Array.isArray(stopWords)) throw new Error('The option "stopWords" must be an array.')
	else if (stopWords) stopWords = [ ...new Set(stopWords) ]

	if (!isAbsolute(contentFolder)) contentFolder = resolve(cwd || currentWorkingDirectory(), contentFolder)

	logger.info('Finding all content files')
	const files = await glob(globString, { cwd: contentFolder })
		.then(files => files.filter(preFilter))
		.then(files => Promise.all(
			files
				.sort() // to make id list deterministic, and for legibility in logs and files-list index
				.map((file, index) => parseFile({ contentFolder, file, index, formatMetadata, formatBlockMetadata, yamlOptions })),
		))
		.then(parsed => parsed.filter(filterFile))
	if (verbose) for (const { file } of files) logger.info('-', file)
	const filesList = files.map(f => f.file)
	logger.info(`Found and parsed ${files.length} content files`)

	const site = mergeMetadata && mergeMetadata({ files })
	let prepared
	if (prepareFilesData) {
		logger.info('Preparing files data')
		prepared = await prepareFilesData({ files, site })
	}
	if (saveSite) {
		logger.info('Saving site information')
		await saveSite({ site, files, prepared })
	}

	logger.info('Processing all content files')
	const times = []
	const processSingleFile = async ({ metadata, file, blocks }) => {
		const start = Date.now()
		if (prepareBlock) blocks = await Promise.all(blocks.map(
			block => prepareBlock(block, { file, metadata, blocks, files, site, prepared })
				.then(data => ({ ...block, data })),
		))
		const record = finalizeRecord({ file, metadata, blocks, files, site, prepared })
		if (saveFile) await saveFile({ record, file, metadata, blocks, files, site })
		times.push(Date.now() - start)
		return record
	}

	const processedFiles = (await Promise.all(files.map(file => processSingleFile(file))))
		.filter(Boolean)

	if (options.output === false) {
		logger.info('Output set to false, skipping index generation.')
		return undefined
	}

	const {
		chunks,
		chunkIdToFileIndex,
		chunkMetadata,
		fileToMetadata,
	} = makeChunks({
		files: processedFiles,
		searchableFields,
		verbose,
	})

	let sum = 0
	for (let t of times) sum += t
	logger.info('Average file process time (milliseconds):', Math.floor(sum / times.length * 1000) / 1000)


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
					logger.warn('Found invalid facet value. Faceted values must be primitive strings or numbers, or arrays containing only strings or numbers.', { file: file.file, facet: facetKey, value: file.metadata[facetKey] })
					delete file.metadata[facetKey]
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
		let lines = 'MiniSearch searchable fields:'
		for (const f of _minisearchOptions.fields) lines += ('\n- ' + f)
		logger.info(lines)
	}
	logger.info('Building search index')
	const miniSearch = new MiniSearch(_minisearchOptions)
	miniSearch.addAll(chunks)
	logger.info('Optimizing and packing index')

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
