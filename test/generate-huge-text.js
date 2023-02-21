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
	const book = JSON.parse(await readFile(join(jsonDir, bookFileName), 'utf8'))
	let currentChapterNumber
	let chapterCollector
	for (const { type, chapterNumber, value } of book) {
		if (chapterNumber && chapterNumber !== currentChapterNumber) {
			if (currentChapterNumber && chapterCollector) {
				console.log(`Writing chapter ${currentChapterNumber} of ${bookFileName}`)
				await writeFile(join(bookDir, `chapter-${currentChapterNumber}.md`), chapterCollector, 'utf8')
			}
			currentChapterNumber = chapterNumber
			chapterCollector = chapterFrontmatter(bookFileName, chapterNumber)
		}
		if (type === 'paragraph start' || type === 'paragraph text') {
			chapterCollector += (value || '')
		} else if (type === 'paragraph end') {
			chapterCollector += '\n\n'
		}
	}
}
