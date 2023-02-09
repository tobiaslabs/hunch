# 🔎 Hunch

Compiled search for your static Markdown files.

> Quick links to the docs: [all docs](https://hunchjs.com/docs/category/recipes-using), [configuration](https://hunchjs.com/docs/configuration), [query params](https://hunchjs.com/docs/searching), [results types](https://hunchjs.com/docs/results), [indexing examples](https://hunchjs.com/docs/category/recipes-indexing), [using examples](https://hunchjs.com/docs/category/recipes-using).

Hunch supports these search features:

- Full text lookup [docs](https://hunchjs.com/docs/searching#full-text-lookup)
- Fuzzy search [docs](https://hunchjs.com/docs/searching#fuzzy-search)
- Return only partial snippet [docs](https://hunchjs.com/docs/searching#snippet)
- Search specific fields [docs](https://hunchjs.com/docs/searching#search-specific-fields)
- Return specific fields [docs](https://hunchjs.com/docs/searching#return-specific-fields)
- Prefix search [docs](https://hunchjs.com/docs/searching#prefix)
- Search suggestions [docs](https://hunchjs.com/docs/searching#suggest)
- Boosting metadata properties [docs](https://hunchjs.com/docs/searching#boost)
- Ranking [docs](https://hunchjs.com/docs/searching#score)
- Facet Limiting [docs](https://hunchjs.com/docs/searching#return-specific-facets)
- Facet Matching [docs](https://hunchjs.com/docs/searching#facet-matching)
- Pagination [docs](https://hunchjs.com/docs/searching#pagination)
- Stop-Words [docs](https://hunchjs.com/docs/searching#stop-words)
- Sort by alternate strategy [docs](https://hunchjs.com/docs/searching#sort)

Hunch compiles a search index to store as a JSON file, which you load and use wherever you want to perform search: AWS Lambda, Cloudflare Worker, even directly in the browser!

## Install

The usual ways:

```bash
npm install hunch
```

## Generate the index

Use it as a CLI tool:

```bash
hunch
# shorthand for
hunch --config hunch.config.js
```

Or use it in code:

```js
import { generate } from 'hunch'
const index = await generate({
  input: './site',
  // other options
})
```

## Query the index

You'll need to load the index from the generated JSON file. In environments with disk access, that's could be as simple as:

```js
import { readFile } from 'node:fs/promises'
const index = JSON.parse(await readFile('./dist/hunch.json', 'utf8'))
// or with upcoming JavaScript, eventually you could do
import index from './dist/hunch.json' assert { type: 'json' }
```

Then you create a search instance using Hunch, and query it:

```js
import { hunch } from 'hunch'
const search = hunch({ index })
const results = search({ q: 'we get signal' })
/*
results = {
  items: [ ... ],
  page: { ... },
  facets: { ... },
}
*/
```

## Overview

Many modern websites are backed by static Markdown files with some YAML-like metadata at the top, e.g. this file `2022-12-29/cats-and-dogs.md`:

```md
---
title: About Cats & Dogs
summary: Where I talk about pets.
published: 2022-12-29
tags: [ cats, dogs ]
series: Animals
---

Fancy words about cats and dogs.
```

As part of your deployment step, you would use Hunch to generate a pre-computed search index as a JSON file:

```bash
hunch --config hunch.config.js
```

A simple configuration file would specify the content folder (where the Markdown files are), the output filepath to write the JSON file, and other configuration details:

```js
// hunch.config.js
export default {
  // Define the folder to scan.
  input: './site',
  // Define where to write the index file.
  output: './dist/hunch.json',
  // Property names of metadata to treat as "collections", like "tags" or "authors".
  facets: {
    // If it's just a flat string there's nothing to configure.
    series: true,
    // If it's more, like an array, you'll need to specify how Hunch
    // should treat the values. (See documentation for more details.)
    tags: {
      type: 'array',
    }
  },
  // All the facet fields are searchable by default, but you need
  // to specify additional searchable fields.
  searchableFields: [
    'title',
    'summary',
  ],
  // Fields that are not searchable that you want available for access
  // need to be specified. These fields are stored in the index JSON, but
  // not used by Hunch.
  storedFields: [
    'published',
  ],
}
```

To make a search using this index, you would create a Hunch instance with the index, and then query it:

```js
// Load the generated JSON file in one way or another:
import { readFile } from 'node:fs/promises'
const index = JSON.parse(await readFile('./dist/hunch.json'))

// Create an instance of Hunch using that data:
import { hunch } from 'hunch'
const search = hunch({ index })

// Then query it:
const results = search({
  q: 'fancy words',
  facetMustMatch: { tags: [ 'cats' ] },
  facetMustNotMatch: { tags: [ 'rabbits' ] },
})
/*
results = {
  items: [
    {
      title: 'About Cats & Dogs',
      tags: [ 'cats', 'dogs' ],
      summary: 'Where I talk about pets.',
      published: '2022-12-29',
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
  facets: {
    series: {
      Animals: {
        all: 3,
        search: 1,
      },
    },
    tags: {
      cats: {
        all: 5,
        search: 1
      }
      dogs: {
        all: 3,
        search: 1
      }
    },
  },
}
*/
```

## URL Query [docs](https://hunchjs.com/docs/searching)

If you are using Hunch as an API with a URL query parameter interface, such as AWS Lambda, Cloudflare Worker, or even the browser, you can easily transform those query parameters into a Hunch query object:

```js
// from the main
import { fromQuery } from 'hunch'
// or from the named export
import { fromQuery } from 'hunch/from-query'
const query = normalize({
  q: 'fancy words',
  'facet[tags]': 'cats,-rabbits',
})
/*
query = {
  q: 'fancy words',
  facetMustMatch: { tags: [ 'cats' ] },
  facetMustNotMatch: { tags: [ 'rabbits' ] },
}
*/
```

## Additional Notes

Behind the scenes this libary uses [MiniSearch](https://github.com/lucaong/minisearch) for text searching, so look at that documentation if you need anything more esoteric.

⚠️ The output JSON file is an amalgamation of a MiniSearch index and other settings, optimized to save space. There is **no guarantee** as to the output structure or contents between Hunch versions: you **must** compile with the same version that you search with!

Some things left to do:
- [ ] Stemming (undecided if I'll support this...)

## License

Published and released under the [Very Open License](http://veryopenlicense.com).
