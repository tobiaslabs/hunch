import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'
import { toText } from 'hast-util-to-text'

/*

In this example, when we prepare the Markdown content we're going to convert
it to hast (HTML abstract state tree) which we will then use to generate the
content for the final record.

This requires a lot more processing than the `basic` test in this folder that
uses simple search-replace, but is obviously more thorough in creating clean
and plain text strings that can be reliably indexed.

*/

export default {
	prepareBlock: async (block) => {
		if (block.name === 'markdown') return toHast(fromMarkdown(block.content))
	},
	finalizeRecord: async ({ file, metadata, blocks }) => {
		blocks = blocks
			.filter(block => block.name === 'markdown')
			.map(({ name, id, metadata, data }) => {
				return {
					name, id, metadata, content: toText(data),
				}
			})
		return { file, metadata, blocks }
	},
}
