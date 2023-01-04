import { resolve, isAbsolute } from 'node:path'
import sade from 'sade'
import { generate } from './generate.js'

const humanTime = millis => {
	// numbers picked to look nice-enough
	if (millis < 1_000) return `${millis} milliseconds`
	if (millis < 120_000) return `${Math.round(millis / 100) / 10} seconds` // 113_456 => '113.5' seconds
	else return `${Math.round(millis / 6000) / 10} minutes` // 4_567_890 => '76.1 minutes'
}

const cli = sade('hunch', true)

cli
	.version('__build_version__')
	.describe('Compiled search for your static Markdown files.')
	.option('-c, --config', 'Path to configuration file.', 'hunch.config.js')
	.option('--cwd', 'Set the current working directory somewhere else.')
	.example('--config hunch.config.js')
	.example('--config hunch.config.js --cwd ../../')
	.example('-c hunch.config.js')
	.example('-c')
	.action(({ config, cwd }) => {
		cwd = cwd || process.cwd()
		if (!isAbsolute(cwd)) cwd = resolve(cwd)
		if (typeof config !== 'string') config = 'hunch.config.js'
		if (!isAbsolute(config)) config = resolve(config)
		const start = Date.now()
		import(config)
			.then(({ default: opts }) => generate({ ...opts, cwd }))
			.then(() => {
				// TODO write to disk here, not in the `generate`
				console.log(`Hunch completed in ${humanTime(Date.now() - start)}.`)
			})
	})

cli.parse(process.argv)
