import { load, JSON_SCHEMA } from 'js-yaml'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toString } from 'mdast-util-to-string'

/*
Blockdown syntax delimits content by a separator which must include
a name, and that name is typically the content type. For example, the
specifications[1] show a blockdown document that looks like this:

	---
	title: My Post
	---

	Some exciting words.

	---!mermaid[size=large]

	pie title NETFLIX
		"Time spent looking for movie" : 90
		"Time spent watching it" : 10

	---!md

	More words.

Here we will construct a map to tokenize the different content types
in the `content-basic` folder, which are `markdown` and `yaml`.

[1]: https://blockdown.md/
*/
const blockNameToParser = {
	/*
	Tokenizing markdown can be done any number of ways, but here we
	are simply going to strip it down to plain text. This does remove
	formatting and such, but in search results that is often fine, and
	we can explore other tokenization methods to retain formatting.
	*/
	markdown: (block) => {
		const tree = fromMarkdown(block.content)
		block.content = toString(tree)
		return block
	},

	/*
	For similar reasons, tokenizing a YAML string to be searchable is
	often not supported but can be desirable. The tokenization method
	here is similarly very rudimentary, but shows some ways you can
	possibly make more information available.
	*/
	yaml: (block) => {
		// One possible solution is to retain the original content, so
		// you can display it more accurately in your search results:
		const original = block.content
		// You could also store a pre-parsed version, so that you don't
		// need to do the parsing on the client side:
		const parsed = load(block.content, { schema: JSON_SCHEMA })
		// Those can be stored in the block's metadata:
		block.metadata = {
			...(block.metadata || {}),
			original,
			parsed,
		}
		// And then finally tokenize the YAML string to make it searchable:
		block.content = block
			.content
			.replaceAll(':', ' ')
			.replaceAll('-', ' ')
			.replaceAll(/\s+/g, ' ')
			.trim()
		return block
	},
}

export default {
	prepareBlock: async (block) => {
		if (blockNameToParser[block.name]) return blockNameToParser[block.name](block)
	},
}
