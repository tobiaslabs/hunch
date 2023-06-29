import { fromHtml } from 'hast-util-from-html'

export const prepareBlock = async (block, { file, prepared: { renderer } }) => {
	if ([ 'md', 'markdown' ].includes(block.name)) {
		const { html } = await renderer.fromString(block.content, file)
		return fromHtml(html, { fragment: true })
	}
}
