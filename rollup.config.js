import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

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
