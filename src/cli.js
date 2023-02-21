import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, isAbsolute } from 'node:path'
import CheapWatch from 'cheap-watch'
import sade from 'sade'

import { generate } from './generate.js'
import { startServer } from './utils/server.js'

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
	const outputData = await generate({ ...opts, cwd, verbose })
	const string = JSON.stringify(outputData, undefined, indent ? '\t' : '')
	console.log('Index file size:', humanBytes(new TextEncoder().encode(string).length))
	await writeFile(outputFilepath, string, 'utf8')
	return outputData
}

const run = async ({ config, cwd, delay, indent, serve, verbose, watch }) => new Promise(
	(resolvePromise, rejectPromise) => import(config)
		.then(({ default: opts }) => {
			const port = typeof serve === 'number' ? serve : 9001
			let { output: outputFilepath } = opts
			if (!outputFilepath) throw new Error('Must specify an output filepath.')
			if (!isAbsolute(outputFilepath)) outputFilepath = resolve(cwd, outputFilepath)
			mkdir(dirname(outputFilepath), { recursive: true })
				.then(() => {
					if (watch) {
						const watch = new CheapWatch({
							dir: isAbsolute(opts.input)
								? opts.input
								: resolve(cwd, opts.input),
							debounce: 80,
						})
						const rebuildIndex = () => {
							console.log('Rebuilding index, one moment...')
							build({ cwd, indent, opts, outputFilepath, serve, verbose })
								.then(index => { if (serve) startServer({ port, index, delay }) })
								.catch(error => {
									console.error('Error while building index:', error)
								})
						}
						watch.on('+', rebuildIndex)
						watch.on('-', rebuildIndex)
						watch.init().then(() => {
							rebuildIndex()
						})
					} else {
						build({ cwd, indent, opts, outputFilepath, serve, verbose })
							.then(index => {
								if (serve) startServer({ port, index, delay })
								else resolvePromise()
							})
					}
				})
				.catch(rejectPromise)
		})
		.catch(rejectPromise),
)

const cli = sade('hunch', true)

cli
	.version('__build_version__')
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
				console.log(`Hunch completed in ${humanTime(Date.now() - start)}.`)
				process.exit(0)
			})
			.catch(error => {
				console.error('Unexpected error while running Hunch!', error)
				process.exit(1)
			})
	})

cli.parse(process.argv)
