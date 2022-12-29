# 👊 SearchMD

Add powerful search to your Markdown content, using the power of AWS Lambda. (Or Cloudflare Worker if your data set is small enough.)

SearchMD supports these search features:

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
  - Since this is highly language dependent, these are not built in. You'll need to specify them in your SearchMD configuration e.g. `stopWords: [ 'and', 'or' ]`
- Sort by metadata properties
  - Return paginated results sorted by metadata instead of search score, using `sort=tag,series` a comma-seperated list of fields
- List counts for aggregated data
  - Simply don't set a `q` on your query parameter.
  - If you've set up `tag` as an aggregation, return an object containing `tag` as a key, with a document count for each `tag` value.

Coming soon?
- Stemming: a rudimentary form can be implemented with MiniSearch, see the docs: https://lucaong.github.io/minisearch/index.html#term-processing

Also:
- Indexes are built into the bundled JS file, but the whole file content is not. A file-system loader will be written and you can use that, but if you don't want to than set `useFileLoader: false` and pass in your own.

## Example

Suppose you have a normal static website, with markdown files that look like this:

```md
---
title: My Cool Post
tags: cats, dogs
---

Fancy words about cats and dogs.
```

SearchMD will generate a JavaScript file with an export that uses a search index that's pre-compiled for the fastest cold-start time possible:

```js
import { search } from './build/path/search.js'
// A normal Lambda event handler from an AWS API Gateway:
export const handler = async event => {
	// Here you would do query parameter normalization, authentication, or
	// anything else, and then perform your search:
	const { results } = await search(event.queryStringParameters)
	// results = [
	// 	{
	// 		id: 'filepath of document',
	// 		metadata: {
	// 			title: 'My Cool Post',
	// 			tags: [ 'cats', 'dogs' ],
	// 		},
	// 		blocks: [
	// 			{
	// 				content: '\nFancy words about cats and dogs.'
	// 			}
	// 		]
	// 	},
	// 	// etc.
	// ]
	return {
		statusCode: 200,
		body: JSON.stringify(results),
		headers: { 'content-type': 'application/json' },
	}
}
```

## Overview

SearchMD generates indexes from a folder of content files, bundling that into a single JavaScript file that you would call to do your search later.

Deploying that bundle out to AWS is left up to you, but if you want a really simple API Gateway + Lambda integration, have a look at the cheat-sheet below for an example that uses [serverless](https://www.serverless.com/framework/docs/providers/aws/cli-reference/deploy-function) to deploy it.

When a query comes to the Lambda, it uses the pre-computed search index to perform the search, returning the results.

Cold start times (the first execution instance) should be pretty fast, even for modest sized content (300-400 documents), and of course warmed execution times are even faster.

## Build Configuration

SearchMD looks for a file `searchmd.config.js` by default, but pass in `-c` or `--config` to specify a different file.

## Processing

SearchMD will work without pre-processing if you use YAML-flavored frontmatter and plain Markdown. For different content (e.g. GitHub flavored, MultiMarkdown, etc.) you may be able to configure SearchMD will need to pre-process it. If you use anything more exotic or esoteric, you may need to convert it into a SearchMD-usable file tree as your own pre-processing step before running SearchMD.

### Filtering Files

By default, SearchMD will look in the folder you point it at, and attempt to ingest all files ending in `.md` (aka Markdown).

You can configure that one of two ways:

**1: File Glob Parameters**

SearchMD uses [tiny-glob](https://www.npmjs.com/package/tiny-glob) with a default parameter of `**/*.md` which you can override:

```js
// searchmd.config.js
export default {
	// To support `.txt` files as well:
	glob: '**/*.{md,txt}',
}
```

**2: Pre-Process File Filter**

You can provide a function to tell SearchMD whether to index a file or not, based on its filename:

```js
// searchmd.config.js
export default {
	// Given the relative filename and path, e.g. `folder1/folder2/file.md`
	preFilter: file => {
		// Return truthy to index the file, falsey to exclude.
		return !file.startsWith('draft/')
	},
}
```

**3: Processed File Filter**

You can provide a function to tell SearchMD whether to index a file or not, based on the processed file:

```js
// searchmd.config.js
export default {
	processedFilter: ({
		file,
		metadata,
		blocks,
	}) => {
		return !file.startsWith('draft/') && metadata.published?.getTime() > Date.now()
	}
}
```

## Pre-Processing

Under the covers, SearchMD makes use of [UnifiedJS](https://unifiedjs.com/) to process the content files into an AST (Abstract State Tree) to be able to generate a search index construction. This means you can configure SearchMD' pre-processing using plugins/extensions in the [syntax-tree](https://github.com/syntax-tree/mdast-util-gfm) ecosystem.

For example, adding support for GitHub flavored Markdown is as easy as:

```js
// searchmd.config.js
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

## Metadata Normalization

You can pass in a function to normalize metadata, for example if your `tags` metadata is a mix of strings and arrays:

```js
// searchmd.config.js
export default {
	normalizeMetadata: metadata => {
		if (typeof metadata.tags === 'string') metadata.tags = metadata.tags.split(/,\s*/)
		return metadata
	},
}
```

## Post-Processing

SearchMD internally converts content files to plaintext (without any markup) broken down into smaller chunks. These chunks are used for the initial text lookups, and the results are then used to match to chunks from the original content file. These content chunks are what is passed back from SearchMD.

For example, given a markdown section like this:

```markdown
My *dogs* are barking.
```

SearchMD will convert that to `my dogs are barking` so that a search for `"dogs are barking"` will rank correctly, but the search result will be the original `My *dogs* are barking.`

The final content chunks aren't used by SearchMD internally, but they








```js
import { search } from './build/search.js'
import { loadChunksFs } from 'searchmd/load-chunks-fs'
export const handler = async event => {
	const { results } = await search(event.queryStringParameters)
	// results = [
	// 	{
	// 		id: 'filepath of document',
	// 		metadata: {
	// 			title: 'My Cool Post',
	// 			tags: [ 'cats', 'dogs' ],
	// 		},
	// 		chunks: [
	// 			'id1',
	// 			// etc.
	// 		],
	// 	},
	// 	// etc.
	// ]
	const chunks = await loadChunksFs(results)
	// chunks = {
	// 	id1: {
	// 		content: '\nFancy words about cats and dogs.'
	// 	}
	// }
	return {
		statusCode: 200,
		body: JSON.stringify({ results, chunks }),
		headers: { 'content-type': 'application/json' },
	}
}
```












TODO:
what about e.g. a search for `word1 word2` where the markdown is `word1 *word2*` or `word1 <span>word2</span>`
it's like you need a sourcemap from `word1 *word2*` to the plaintext, do a search on the plaintext, and then map to the original
could go simple for now, e.g. flatten everything for indexing, then return the results as whatever format you like





SearchMD supports basic Markdown with YAML-flavored Frontmatter out of the box, but you'll need to configure pre-processing if you are using something more complex like GitHub-flavored Markdown, or templates, or similar.

One solution for more complex content files would be to generate plain Markdown files as part of your build/deploy pipeline, into some temporary folder, and then point SearchMD to that.


## Reserved Metadata Properties

TODO: I can't figure out how to remap `id` to e.g. `_id` so you can't have an `id` frontmatter property.

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software=searchmd).
