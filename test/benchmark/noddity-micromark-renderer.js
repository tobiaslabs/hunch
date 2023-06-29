import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import { hastUtilNoddity } from 'hast-util-noddity'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { raw } from 'hast-util-raw'
import { frontmatter } from 'micromark-extension-frontmatter'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { load, JSON_SCHEMA } from 'js-yaml'
import { micromarkFromNoddity, mdastFromNoddity } from 'mdast-util-noddity'
import Ractive from 'ractive'

Ractive.DEBUG = false

import { noddityRenderer } from 'noddity-micromark-renderer'

const legacyRactiveNoddityRenderer = ({ filename, templateString, metadata, variables, innerHtml }) => {
	const data = {
		pathPrefix: '/',
		pagePathPrefix: '',
		filename,
	}
	;(variables || []).forEach((v, index) => {
		if (v.positional) data[index + 1] = v.name
		else data[v.name] = v.value
	})
	if (metadata) data.metadata = metadata
	return innerHtml
		? Ractive({ partials: { current: innerHtml }, template: templateString, data }).toHTML()
		: Ractive({ template: templateString, data }).toHTML()
}

export const createNoddityMicromarkRenderer = ({ noddityDirectory, websiteDomain, hastSanitizer }) => {
	const addNoddityToHtml = async hastTree => hastUtilNoddity(hastTree, {
		urlRenderer: async ({ file, id, nodes }) => ([
			{
				type: 'element',
				tagName: 'a',
				properties: { href: `https://${websiteDomain}/${file}${id ? `#${id}` : ''}` },
				children: nodes,
			},
		]),
		templateRenderer: async ({ file, parameters }) => {
			const variables = parameters.map(p => {
				if (p.key && p.value !== undefined) return { name: p.key, value: p.value }
				return { positional: true, name: p }
			})
			const { html } = await renderer.loadFile(file, { variables })
			return [
				{
					type: 'raw',
					value: html,
				},
			]
		},
	})

	const renderer = noddityRenderer({
		loadFile: async file => readFile(join(noddityDirectory, file), 'utf8'),
		metadataParser: string => load(string, { schema: JSON_SCHEMA }),
		urlRenderer: async ({ link }) => `https://${websiteDomain}/${link}`,
		nonMarkdownRenderer: legacyRactiveNoddityRenderer,
		markdownToMdast: string => fromMarkdown(string, {
			extensions: [
				frontmatter([ 'yaml' ]),
				gfm(),
				micromarkFromNoddity(),
			],
			mdastExtensions: [
				frontmatterFromMarkdown([ 'yaml' ]),
				gfmFromMarkdown(),
				mdastFromNoddity(),
			],
		}),
		mdastToHast: mdastTree => toHast(mdastTree, { allowDangerousHtml: true }),
		hastToHtml: async hastTree => {
			hastTree = raw(hastTree)
			if (hastSanitizer) hastTree = hastSanitizer(hastTree)
			for (const child of hastTree.children) await addNoddityToHtml(child)
			return toHtml(hastTree, { allowDangerousHtml: true })
		},
	})

	return renderer
}
