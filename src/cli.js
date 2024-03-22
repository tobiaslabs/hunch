import { pathToFileURL } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, isAbsolute } from 'node:path'
import CheapWatch from 'cheap-watch'
import sade from 'sade'

import { generate } from './generate.js'
import { startServer } from './utils/server.js'
import { logger } from './utils/logger.js'

// numbers picked to look approximately nice enough
const humanTime = millis => {
	if (millis < 1_000) return `${millis} milliseconds`
	if (millis < 120_000) return `${Math.round(millis / 100) / 10} seconds` // 113_456 => '113.5' seconds
	else return `${Math.round(millis / 6000) / 10} minutes` // 4_567_890 => '76.1 minutes'
}
const humanBytes = bytes => {
	if (bytes < 2_000) return `${bytes} bytes`
	if (bytes < 600_000) return `${Math.round(bytes / 100) / 10} KB`
	else return `${Math.round(bytes / 100_000) / 10} MB`
}

const build = async ({ cwd, indent, opts, outputFilepath, verbose }) => {
	const outputIndexData = await generate({ ...opts, cwd, verbose })
	if (opts.output !== false) {
		logger.info('Search index generated')
		const string = JSON.stringify(outputIndexData, undefined, indent ? '\t' : '')
		await writeFile(outputFilepath, string, 'utf8')
		logger.info(`Index written to disk (${humanBytes(new TextEncoder().encode(string).length)})`)
		return outputIndexData
	}
}

const optionalMkdir = async (filepath) => {
	if (filepath) return mkdir(dirname(filepath), { recursive: true })
}

const run = async ({ config, cwd, delay, indent, serve, verbose, watch }) => new Promise(
	(resolvePromise, rejectPromise) => import(pathToFileURL(config).href)
		.then(({ default: opts }) => {
			const port = typeof serve === 'number' ? serve : 9001
			let { output: outputFilepath } = opts
			if (!outputFilepath && outputFilepath !== false) throw new Error('Must specify an output filepath.')
			if (outputFilepath && !isAbsolute(outputFilepath)) outputFilepath = resolve(cwd, outputFilepath)
			optionalMkdir(outputFilepath)
				.then(() => {
					if (watch) {
						const watch = new CheapWatch({
							dir: isAbsolute(opts.input)
								? opts.input
								: resolve(cwd, opts.input),
							debounce: 80,
						})
						const rebuildIndex = () => {
							logger.info('Rebuilding...')
							build({ cwd, indent, opts, outputFilepath, serve, verbose })
								.then(index => {
									if (index && serve) startServer({ port, index, delay })
									else logger.info('Build complete.')
								})
								.catch(error => {
									logger.error('Error while building:', error)
								})
						}
						watch.on('+', rebuildIndex)
						watch.on('-', rebuildIndex)
						watch.init().then(() => {
							logger.info('Initial build in progress...')
							rebuildIndex()
						})
					} else {
						build({ cwd, indent, opts, outputFilepath, serve, verbose })
							.then(index => {
								if (index && serve) startServer({ port, index, delay })
								else resolvePromise()
							})
					}
				})
				.catch(rejectPromise)
		})
		.catch(rejectPromise),
)

const cli = sade('hunch', true)

const BUILD_VERSION = '__build_version__'

cli
	.version(BUILD_VERSION)
	.describe('Compiled search for your static Markdown files.')
	.option('-c, --config', 'Path to configuration file.', 'hunch.config.js')
	.option('--cwd', 'Set the current working directory somewhere else.')
	.option('--delay', 'When serving locally, introduce some milliseconds of delay on HTTP requests to simulate network delays.')
	.option('--indent', 'Indent the output JSON, typically for debugging purposes.')
	.option('--serve', 'Start a search server using canonical query parameters. (Default port: 9001)')
	.option('--verbose', 'Print additional information during build.')
	.option('-w, --watch', 'Rebuild the index on input file changes.')
	.example('--config hunch.config.js')
	.example('-c hunch.config.js')
	.example('--config hunch.config.js --cwd ../../ --indent --verbose')
	.example('--serve 8080 # change the port')
	.action(({ config, cwd, delay, indent, serve, verbose, watch }) => {
		cwd = cwd || process.cwd()
		if (!isAbsolute(cwd)) cwd = resolve(cwd)
		if (typeof config !== 'string') config = 'hunch.config.js'
		if (!isAbsolute(config)) config = resolve(config)
		const start = Date.now()
		run({ config, cwd, delay: parseInt(delay, 10) || 0, indent, serve, verbose, watch })
			.then(() => {
				logger.info(`Hunch completed (${humanTime(Date.now() - start)})`)
				process.exit(0)
			})
			.catch(error => {
				logger.error(`
Unexpected error while running HunchJS! Please report the following details to the maintainers at https://github.com/tobiaslabs/hunch or on Discord https://discord.gg/AKUtZf5jjb

version: hunch@${BUILD_VERSION}
config: ${config}
cwd: ${cwd}
`, error)
				process.exit(1)
			})
	})

cli.parse(process.argv)
