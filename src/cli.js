import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, isAbsolute } from 'node:path'
import sade from 'sade'
import { generate } from './generate.js'

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

const cli = sade('hunch', true)

const run = async ({ config, cwd, indent, verbose }) => {
	const { default: opts } = await import(config)
	let { output: outputFilepath } = opts

	if (!outputFilepath) throw new Error('Must specify an output filepath.')
	if (!isAbsolute(outputFilepath)) outputFilepath = resolve(cwd, outputFilepath)
	await mkdir(dirname(outputFilepath), { recursive: true })

	const outputData = await generate({ ...opts, cwd, verbose })
	const string = JSON.stringify(outputData, undefined, indent ? '\t' : '')
	console.log('Index file size:', humanBytes(new TextEncoder().encode(string).length))
	await writeFile(outputFilepath, string, 'utf8')
}

cli
	.version('__build_version__')
	.describe('Compiled search for your static Markdown files.')
	.option('-c, --config', 'Path to configuration file.', 'hunch.config.js')
	.option('--cwd', 'Set the current working directory somewhere else.')
	.option('--indent', 'Indent the output JSON, typically for debugging purposes.')
	.option('--verbose', 'Print additional information during build.')
	.example('--config hunch.config.js')
	.example('-c hunch.config.js')
	.example('--config hunch.config.js --cwd ../../ --indent --verbose')
	.action(({ config, cwd, indent, verbose }) => {
		cwd = cwd || process.cwd()
		if (!isAbsolute(cwd)) cwd = resolve(cwd)
		if (typeof config !== 'string') config = 'hunch.config.js'
		if (!isAbsolute(config)) config = resolve(config)
		const start = Date.now()
		run({ config, cwd, indent, verbose })
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
