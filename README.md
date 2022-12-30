# 🔎 Hunch

Compiled search for your static Markdown files.

*(Does not rely on disk access, so you can also use it in the browser or in Cloudflare Worker, if your data set is small enough.)*

Hunch supports these search features:

- Full text lookup
  - To find records with `exact words` use `q=exact words`
- Fuzzy search
  - To find `cats` and `kats` you might use `q=cats&fuzzy=0.8`
- Search specific fields
  - To search only in certain properties use `q=words&fields=title,description` a comma-seperated list of fields
- Prefix search
  - To find `motorcycle` and `motocross` you might do `q=moto&prefix=true`
- Search suggestions
  - To turn a user string `arch` into e.g. `archery sport` use `q=arch&suggest=true`
- Boosting metadata properties
  - In configuration set `minisearchOptions.boost` to an object like `{ title: 2 }`
  - Per-request set `boost[title]=2`
- Ranking
  - The search results include a ranking value called `score`, for you to sort with
- Facets
  - Filter by content metadata, e.g. for content with a `tag` metadata containing `cats` or `dogs` use `facet[tag]=cats,dogs` a comma-seperated list, prefix with `-` to exclude, e.g. `facet[tag]=cats,-dogs`
- Pagination
  - Specify how many results with `page[size]` and a pagination offset with `page[number]`
- Stop-Words
  - Since this is highly language dependent, these are not built in. You'll need to specify them in your Hunch configuration e.g. `stopWords: [ 'and', 'or' ]`
- Sort by metadata properties
  - Return paginated results sorted by metadata instead of search score, using `sort=tag,series` a comma-seperated list of fields
- List counts for aggregated data
  - Simply don't set a `q` on your query parameter.
  - If you've set up `tag` as an aggregation, return an object containing `tag` as a key, with a document count for each `tag` value.

Coming soon?
- Stemming: a rudimentary form can be implemented with MiniSearch, see the docs: https://lucaong.github.io/minisearch/index.html#term-processing

Also:
- Indexes are built into the bundled JS file, but the whole file content is not. A file-system loader will be written and you can use that, but if you don't want to than set `useFileLoader: false` and pass in your own.

## Usage

Install the usual ways:

```bash
npm install hunch
```

Use it as a CLI tool:

```bash
hunch
# shorthand for
hunch --config hunch.config.js
```

Or use it in code:

```js
import { generate } from 'hunch'
await generate({
	input: './site',
	output: './dist/hunch.json',
	// other options
})
```

## Overview

Many modern websites are backed by static Markdown files with some YAML-like metadata at the top, e.g. this file `2022-12-29/cats-and-dogs.md`:

```md
---
title: About Cats & Dogs
tags: cats, dogs
series: Animals
---

Fancy words about cats and dogs.
```

As part of your deployment step, you would use Hunch to generate a pre-computed search index as a JSON file:

```bash
hunch --config hunch.config.js
```

A simple configuration file would specify the folder containing Markdown files, the output filepath to write the JSON file, and some metadata details:

```js
// hunch.config.js
export default {
	// Define the folder to scan.
	input: './site',
	// Define where to write the index file.
	output: './dist/hunch.json',
	// Property names of metadata to treat as "collections", like "tags" or "authors".
	aggregations: {
		series: {
			// Define some properties about the aggregations.
			title: 'Series',
		},
		tags: {
			title: 'Tags',
			// If multiple values are possible per document, you need to specify
			// how Hunch will treat them. (See documentation for more details.)
			conjunction: false,
		}
	},
	// All the aggregation fields will be searchable, but you need to specify
	// fields that should be searchable that aren't aggregations.
	searchableFields: [
		'title',
		'introduction',
	],
}
```

With this configuration, running Hunch generates a JSON file containing the pre-computed and optimized search index.

To make a search using this index, you would create a Hunch instance with the index, and then query it:

```js
// Load the generated JSON file in one way or another:
import { readFile } from 'node:fs/promises'
const data = JSON.parse(await readFile('./dist/hunch.json'))

// Create an instance of SearchMd using that data:
import { hunch } from 'hunch'
const search = hunch({ data })

// Then query it:
const results = search({
	q: 'fancy words',
	facetInclude: [ 'cats' ],
	facetExclude: [ 'rabbits' ],
})
/*
results = {
	items: [
		{
			title: 'About Cats & Dogs',
			tags: [ 'cats', 'dogs' ],
			series: 'Animals',
			_id: '2022-12-29/cats-and-dogs.md',
			_content: 'Fancy words about cats and dogs.',
		}
	],
	page: {
		number: 0,
		size: 1,
		total: 1,
	},
	aggregations: {
		series: {
			title: 'Series',
			buckets: [
				{
					key: 'Animals',
					count: 1,
				},
			],
		},
		tags: {
			title: 'Tags',
			buckets: [
				{
					key: 'cats',
					count: 1,
				},
				{
					key: 'dogs',
					count: 1,
				},
				{
					key: 'rabbits',
					count: 0,
				},
			],
		}
	}
}
*/
```

If you are using Hunch as an API with a URL query parameter interface, such as AWS Lambda, Cloudflare Worker, or even the browser, you can easily transform those query parameters into a normalized SearchMD query object.

For example, here is a complete AWS Lambda implementation (assuming the event trigger is an AWS API Gateway):

```js
// If you package the generated JSON file into the Lambda bundle, you can
// simply read it from disk:
import { readFile } from 'node:fs/promises'
const data = JSON.parse(await readFile('./dist/hunch.json'))

// Import the normal `hunch` but also the helper `normalize` function:
import { hunch, normalize } from 'hunch'

// Create a Hunch instance like normal:
const search = hunch({ data })

// This is a normal Lambda function, handling an event from an AWS API Gateway:
export const handler = async event => {
	/*
	For example:
	queryStringParameters = {
		q: 'fancy words',
		'facet[tags]': 'cats,-rabbits',
	}
	 */
	const query = normalize(event.queryStringParameters)
	const results = search(query)
	return {
		statusCode: 200,
		body: JSON.stringify(results),
		headers: { 'content-type': 'application/json' },
	}
}
```

Hunch only generates the search index and handles queries of that index, it does not have an opinion about how or where to deploy the functionality.

## Features

This is a list of all the features that Hunch supports out of the box.

#### Full Text Lookup

Find records with exact words.

- **Query Parameter:** `q`
- **Programmatic:** `q`
- **Type:** `String`
- **Example:** `{ q: 'exact words' }`

#### Fuzzy Search

Specify a fuzziness to the text query to find records with misspelled or similar words.
To find `cats` and `kats` you might use `q=cats&fuzzy=0.8`

- **Query Parameter:** `fuzzy`
- **Programmatic:** `fuzzy`
- **Type:** `Float` (Must be a positive value, greater than `0`)
- **Example:** `{ q: 'cats', fuzzy: '0.8' }` would find `cats` and `kats`.

#### Specific Fields

Limit the text query to one or more metadata properties.

- **Query Parameter:** `fields`
  - **Type:** `String` (Comma separated values.)
  - **Example:** `{ q: 'cats', fields: 'title,summary' }` would only look in `title` and `summary`.
- **Programmatic:** `fields`
  - **Type:** `Array<String>`
  - **Example:** `{ q: 'cats', fields: [ 'title', 'summary' ] }` would only look in `title` and `summary`.

#### Prefix search

To find both `motorcycle` and `motocross` you might use `moto` as the query text, and specify it as a prefix.

- **Query Parameter:** `prefix`
  - **Type:** `String` (Must be exactly `true` or `false`.)
  - **Example:** `{ q: 'cats', prefix: 'true' }`.
- **Programmatic:** `prefix`
  - **Type:** `Boolean` (Anything truthy will be interpreted as `true`, all other values as `false`.)
  - **Example:** `{ q: 'cats', prefix: true }`

#### Suggestions

Suggest other search options from the indexed data, e.g. for the query text `arch` suggest `archery sport` or `march madness`.

- **Query Parameter:** `suggest`
  - **Type:** `String` (Must be exactly `true` or `false`.)
  - **Example:** `{ q: 'cats', suggest: 'true' }`.
- **Programmatic:** `suggest`
  - **Type:** `Boolean` (Anything truthy will be interpreted as `true`, all other values as `false`.)
  - **Example:** `{ q: 'cats', suggest: true }`

Note: this does change the results output!

<!--
TODO need to document and test this better
-->












#### Boosting metadata properties

In configuration set `minisearchOptions.boost` to an object like `{ title: 2 }`

  - Per-request set `boost[title]=2`
#### Ranking

The search results include a ranking value called `score`, for you to sort with

#### Facets

Filter by content metadata, e.g. for content with a `tag` metadata containing `cats` or `dogs` use `facet[tag]=cats,dogs` a comma-seperated list, prefix with `-` to
exclude, e.g. `facet[tag]=cats,-dogs`
#### Pagination

Specify how many results with `page[size]` and a pagination offset with `page[number]`

#### Stop-Words

Since this is highly language dependent, these are not built in. You'll need to specify them in your Hunch configuration e.g. `stopWords: [ 'and', 'or' ]`

#### Sort by metadata properties

Return paginated results sorted by metadata instead of search score, using `sort=tag,series` a comma-seperated list of fields

#### List counts for aggregated data

Simply don't set a `q` on your query parameter.

  - If you've set up `tag` as an aggregation, return an object containing `tag` as a key, with a document count for each `tag` value.















## Configuration

When run from the command line, Hunch looks for a file `hunch.config.js` by default, but pass in `-c` or `--config` to specify a different file.

The available configuration properties are:

#### `aggregations`

This property is responsible for generating search facets, it is a dictionary of keys to objects containing these properties:

- `title` - The human-readable name.
- `size` - The number of items to return for this aggregation. (Default: 10)
- `conjunction` - By default, a search with multiple inclusive facets specified will create an `AND` query. By setting this value to `false`, it becomes an `OR` query. You'll probably want to set it to `false` for things like tags/categories.

Note that `aggregations` is passed in to ItemsJS without modification, so you can read [the ItemsJS docs](https://github.com/itemsapi/itemsjs#api) for additional details.

#### `glob`

This is the search string used to ingest files from the input folder.

Default: `**/*.md`

#### `input`

The input directory to scan for files to ingest.

#### `normalizeMetadata`

An optional function which is called during ingestion prior to filtering. It is given the document metadata object, and should return the modified object.

Example:

```js
// hunch.config.js
export default {
	// ... other options, then ...
	normalizeMetadata: metadata => {
		if (typeof metadata.tags === 'string') metadata.tags = metadata.tags.split(';')
		return metadata
	}
}
```

#### `output`

The filepath of where to write the JSON file, e.g. `./dist/hunch.json`

#### `preFilter`

An optional function to filter out files by filename, before they are read. Return truthy to include the file, or falsey to exclude.

Example:

```js
// hunch.config.js
export default {
	// ... other options, then ...
	preFilter: filepath => !filepath.startsWith('draft/')
}
```

#### `processedFilter`

An optional function to filter out files after they are fully read and processed. Return truthy to include the file, or falsey to exclude. (Occurs *after* the `normalizeMetadata` function executes.)

Default: excludes documents where `published` is exactly `false` or is a date that is in the future.

Example:

```js
// hunch.config.js
export default {
	// ... other options, then ...
	processedFilter: ({ metadata }) => metadata.draft !== true
}
```

#### `searchableFields`

A list of field names that should be searchable, that are not an aggregate facet.

This list will *always* include the field names from `aggregations`, as well as `_content`.

## Content Processing

Hunch will work without pre-processing if you use YAML-flavored frontmatter and plain Markdown. For different content (e.g. GitHub flavored, MultiMarkdown, etc.) you may be able to configure SearchMD will need to pre-process it. If you use anything more exotic or esoteric, you may need to convert it into a SearchMD-usable file tree as your own pre-processing step before running SearchMD.

The steps of processing are as follows:

1. Filepaths are grabbed using the `glob` property.
2. If provided, those files are filtered using the `preFilter` function.
3. The files are read from disk and the frontmatter is parsed as YAML to become a metadata object.
4. If provided, each metadata object is passed through the `normalizeMetadata` function.
5. If provided, the parsed file objects are further filtered using the `processedFilter` function.

## Pre-Processing

Under the covers, Hunch makes use of [UnifiedJS](https://unifiedjs.com/) to process the content files into an AST (Abstract State Tree) to be able to generate a search index construction. This means you can configure SearchMD' pre-processing using plugins/extensions in the [syntax-tree](https://github.com/syntax-tree/mdast-util-gfm) ecosystem.

For example, adding support for GitHub flavored Markdown is as easy as:

```js
// hunch.config.js
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
export default {
	micromarkExtensions: [
		gfm(),
	],
	mdastExtensions: [
		gfmFromMarkdown(),
	],
}
```

## Post-Processing

Hunch internally converts content files to plaintext (without any markup) broken down into smaller chunks. These chunks are used for the initial text lookups, and the results are then used to match to chunks from the original content file. These content chunks are what is passed back from SearchMD.

For example, given a markdown section like this:

```markdown
My *dogs* are barking.
```

Hunch will convert that to `my dogs are barking` so that a search for `"dogs are barking"` will rank correctly, but the search result will be the original `My *dogs* are barking.`

The final content chunks aren't used by Hunch internally, but they

TODO:
what about e.g. a search for `word1 word2` where the markdown is `word1 *word2*` or `word1 <span>word2</span>`
it's like you need a sourcemap from `word1 *word2*` to the plaintext, do a search on the plaintext, and then map to the original
could go simple for now, e.g. flatten everything for indexing, then return the results as whatever format you like








## Additional Notes

Behind the scenes this libary uses [ItemsJS](https://github.com/itemsapi/itemsjs) and [MiniSearch](https://github.com/lucaong/minisearch). In general they are pretty excellent, but one thing I can't figure out is how to remap `id` to e.g. `_id` consistently, so until that's sorted out the following metadata properties are internal-use only (if you try to specify them Hunch will throw an error): `id`, `_id`, `_content` and `_file`.

The output JSON file is an amalgamation of a MiniSearch index and other settings, optimized to save space. There is **no guarantee** as to the output structure or contents between Hunch versions: you **must** compile with the same version that you search with!

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software=hunch).
