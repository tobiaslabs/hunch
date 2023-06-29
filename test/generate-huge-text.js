import { readFile, writeFile, readdir, rm, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const contentDir = join(__dirname, 'feature', 'huge-text-search', 'content-basic')
await rm(contentDir, { recursive: true, force: true })
await mkdir(contentDir)

const jsonDir = join(__dirname, '..', 'node_modules', 'world-english-bible', 'json')
const bibleBookFileNames = await readdir(jsonDir)

const chapterFrontmatter = (book, chapter) => `---
book: ${book}
chapter: ${chapter}
---

`

for (const bookFileName of bibleBookFileNames) {
	const bookDir = join(contentDir, bookFileName.replace(/\.json$/, ''))
	await mkdir(bookDir)
	const fragments = JSON.parse(await readFile(join(jsonDir, bookFileName), 'utf8'))
	let currentChapterNumber
	let chapterCollector
	for (const { type, chapterNumber, value } of fragments) {
		if (chapterNumber && chapterNumber !== currentChapterNumber) {
			if (currentChapterNumber && chapterCollector) {
				await writeFile(join(bookDir, `chapter-${currentChapterNumber}.md`), chapterCollector, 'utf8')
			}
			currentChapterNumber = chapterNumber
			chapterCollector = chapterFrontmatter(bookFileName, chapterNumber)
		}
		if (type === 'paragraph start' || type === 'paragraph text' || type === 'line text') {
			chapterCollector += (value || '')
		} else if (type === 'line break') {
			chapterCollector += '\n'
		} else if (type === 'paragraph end') {
			chapterCollector += '\n\n'
		}
	}
}
