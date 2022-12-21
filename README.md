# 👊 Slams

(S)tatic (Lam)bda (S)earch - Easily self host a static site search, using the power of AWS Lambda, [MiniSearch](https://lucaong.github.io/minisearch/), and [ItemsJS](https://github.com/itemsapi/itemsjs).

Slams supports these foundational search features:

- Full text lookup
- Prefix search
- Fuzzy search
- Ranking
- Boosting specific properties
- Facets
- Pagination
- Stemming
- Stop-words

## Example

Suppose you have a normal static website, with markdown files that look like this:

```md
---
title: My Cool Post
tags: cats, dogs
---

Fancy words about cats and dogs.
```

Suppose you'd like to support a basic search for `fancy word` and limit it to files that have the `cats` value in the `tags` metadata.

If you've deployed Slams as a Lambda accessible at `https://site.com/search` you might issue a simple request like (for readability the spaces are not encoded in this example):

```
https://site.com/search?q=fancy word&facet[tags]=cats
```

Slams supports post-search processing, so that request could give back the markdown content file or the fully processed HTML.

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software=slams).
