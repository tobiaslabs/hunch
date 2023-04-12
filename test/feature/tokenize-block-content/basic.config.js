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
	Tokenizing a YAML string to be searchable is not often supported, but
	it definitely makes sense in technical documents. This tokenization
	method is very rudimentary, but it will result in mostly-searchable
	YAML content. Again, this removes formatting from the search result,
	but you're free to explore other tokenization methods as needed.
	*/
	yaml: (block) => {
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
	tokenizeBlockContent: async (block, metadata) => {
		if (blockNameToParser[block.name]) return blockNameToParser[block.name](block, metadata)
		return block
	},
}
