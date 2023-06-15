import MiniSearch from 'minisearch'

const LOOK_AROUND = 3
const WORD_BOUNDARY_CHARS = new Set([
	' ',
	'\n',
])

const approximateTextExtraction = (string, cursor, size, wordBoundaryCharacters = WORD_BOUNDARY_CHARS) => {
	if (size === 0) return { string: '' }

	let out = ''
	let forwardCursor = cursor
	let backwardCursor = cursor - 1
	let breakForward
	let breakBackward
	while (out.length < (size + LOOK_AROUND)) {
		if (!breakForward && string[forwardCursor]) {
			out += string[forwardCursor]
			forwardCursor++
		} else {
			breakForward = true
		}
		if (!breakBackward && string[backwardCursor]) {
			out = string[backwardCursor] + out
			backwardCursor--
		} else {
			breakBackward = true
		}
		if (wordBoundaryCharacters) {
			if (wordBoundaryCharacters.has(string[forwardCursor]) && out.length > (size - LOOK_AROUND)) breakForward = true
			if (wordBoundaryCharacters.has(string[backwardCursor]) && out.length > (size - LOOK_AROUND)) breakBackward = true
		}
		if (breakForward && breakBackward) break
	}

	let before = backwardCursor + 1
	let after = string.length - forwardCursor

	if (wordBoundaryCharacters) {
		let beforeIsAllWordBoundaries = true
		for (let i = backwardCursor; i >= 0; i--) {
			if (!wordBoundaryCharacters.has(string[i])) {
				beforeIsAllWordBoundaries = false
				break
			}
		}
		if (beforeIsAllWordBoundaries) before = 0

		let afterIsAllWordBoundaries = true
		for (let i = string.length - 1; i >= forwardCursor; i--) {
			if (!wordBoundaryCharacters.has(string[i])) {
				afterIsAllWordBoundaries = false
				break
			}
		}
		if (afterIsAllWordBoundaries) after = 0
	}

	return {
		string: out,
		before,
		after,
	}
}

const naiveSnip = (string, snippetLength, queryString, wordBoundaryCharacters, fuzzy) => {
	// If no query string is given, we can just snip the very start of the text.
	if (!queryString) return approximateTextExtraction(string, 0, snippetLength, wordBoundaryCharacters)

	// If a blind lookup finds it, that's the cheapest way, and we'll just
	// grab the very first result.
	const stringLower = string.toLowerCase()
	const queryStringLower = queryString.toLowerCase()
	let cursor = stringLower.split(queryStringLower)
	if (cursor.length > 1) cursor = cursor[0].length
	if (cursor >= 0) return approximateTextExtraction(string, cursor + Math.round(queryString.length / 2), snippetLength, wordBoundaryCharacters)

	// If that doesn't find it, we are dealing with a query that
	// maybe has spaces or is fuzzy or anything else, so we're going
	// to try throwing it at MiniSearch in chunks.
	const paragraphs = string.split('\n')
	const options = fuzzy >= 0
		? { fuzzy }
		: {}
	const miniSearch = new MiniSearch({ fields: [ 'p' ], ...options })
	miniSearch.addAll(paragraphs.map((p, id) => ({ p, id })))
	const match = miniSearch.search(queryString, options)?.[0]
	if (match) {
		let start = 0
		let index = 0
		for (const p of paragraphs) {
			if (index === match.id) break
			index++
			start += (p.length + 1) // the +1 is for the `/n` split
		}
		// At this point we'll try again to find the first query
		// word in the best-matching, but using the indexed term
		// in case fuzzing causes a mismatch.
		const firstQueryWordLower = match.terms[0]
		const matchingParagraph = paragraphs[match.id]
		cursor = matchingParagraph.toLowerCase().split(firstQueryWordLower)
		if (cursor.length > 1) cursor = cursor[0].length
		const out = approximateTextExtraction(matchingParagraph, cursor + Math.round(firstQueryWordLower.length / 2), snippetLength, wordBoundaryCharacters)
		out.start = start + out.start
		out.size = string.length
		return out
	}

	// We couldn't find the query string. This is very peculiar, and I don't
	// think it should happen, but as an emergency fallback we'll return the
	// first text snippet.
	return approximateTextExtraction(string, 0, snippetLength, wordBoundaryCharacters)
}

export const snipContent = ({ q, snippet: propertiesToSnip, fuzzy, includeMatches, wordBoundaryCharacters }, searchResult) => {
	if (propertiesToSnip)
		for (const key in propertiesToSnip) {
			if (key === '_chunks.content') {
				for (const chunk of searchResult._chunks) {
					const { string, before, after } = naiveSnip(chunk.content, propertiesToSnip[key], q, wordBoundaryCharacters, fuzzy)
					chunk.content = string
					if (string) chunk.snippet = { content: { before, after } }
				}
			} else if (typeof searchResult[key] === 'string') {
				const { string, before, after } = naiveSnip(searchResult[key], propertiesToSnip[key], q, wordBoundaryCharacters, fuzzy)
				searchResult[key] = string
				if (string) {
					searchResult._snippet = searchResult._snippet || {}
					searchResult._snippet[key] = { before, after }
				}
			}
		}
	if (includeMatches && Object.keys(searchResult.match || {}).length) {
		searchResult._matches = {}
		for (const matchingWord in searchResult.match) {
			for (const keypath of searchResult.match[matchingWord]) {
				if (keypath === 'content') searchResult._matches['_chunks.content'] = matchingWord
				else searchResult._matches[keypath] = matchingWord
			}
		}
	}
	delete searchResult.terms
	delete searchResult.match
	return searchResult
}
