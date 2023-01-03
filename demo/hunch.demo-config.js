export default {
	input: './content',
	output: './build/hunch.json',
	indent: '\t',
	searchableFields: [
		'title',
	],
	storeFields: [
		'notes',
	],
	facets: [
		'series',
		'tags',
	],
	verbose: true,
}
