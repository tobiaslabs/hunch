import { readFile } from 'node:fs/promises'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'

const { version } = JSON.parse(await readFile('./package.json', 'utf8'))

const normal = [
	'generate',
	'hunch',
	'normalize',
]

export default [
	{
		input: 'src/index.js',
		output: [
			{
				format: 'es',
				file: 'dist/index.js',
			},
			{
				format: 'cjs',
				file: 'dist/index.cjs',
			},
		],
		external: normal.map(name => `./${name}.js`),
	},
	{
		input: 'src/cli.js',
		output: [
			{
				format: 'es',
				file: 'dist/cli.js',
			},
		],
		external: normal.map(name => `./${name}.js`),
		plugins: [
			replace({
				preventAssignment: true,
				values: {
					__build_version__: version,
				},
			}),
			commonjs(),
			resolve({
				browser: true,
			}),
		],
	},
	...normal.map(name => ({
		input: `src/${name}.js`,
		output: [
			{
				format: 'es',
				file: `dist/${name}.js`,
			},
			{
				format: 'cjs',
				file: `dist/${name}.cjs`,
			},
		],
		plugins: [
			commonjs(),
			resolve({
				browser: true,
			}),
		],
	})),
]
