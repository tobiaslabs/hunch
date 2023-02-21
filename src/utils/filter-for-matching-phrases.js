// Match on pairs of single or double quotes, e.g.:
// - "wireless chargers"
// - hello "there general" kenobi
// - why 'hello there'
// - even "multiple kinds" of 'quotes are allowed'
const QUOTED_PHRASE = /"([^"]+)"|'([^']+)'/g

const SPACES_SPLIT = /\s+/

export const filterForMatchingPhrases = (queryString, searchResults) => {
	const phrases = [
		// from `search "wireless    chargers" now` we get
		// {
		//   words: [ 'wireless', 'chargers' ],
		//   regex: 'wireless\s+chargers',
		// }
	]
	for (const match of queryString.toLowerCase().matchAll(QUOTED_PHRASE)) if (match[1] || match[2]) {
		const words = (match[1] || match[2]).split(SPACES_SPLIT)
		phrases.push({
			words,
			regex: new RegExp(words.join('\\s+'), 'i'),
		})
	}
	if (!phrases.length) return searchResults

	/*
	Search result items from MiniSearch look like this:

		{
			terms: [ 'wireless', 'chargers' ],
			match: { wireless: [ 'content' ], chargers: [ 'content' ] },
			content: 'cars with wireless phone chargers are interesting',
		}

	If there are quoted phrases in the query string, we want to make sure
	that the returned items pass two filters:

	1. If every word in the phrase is in the same matched property. E.g.
	for "wireless chargers" if "wireless" is in the title but "chargers"
	is only in the content, that's not a match.

	2. Make sure that the entire phrase is found together in the matching
	property, e.g. the phrase "wireless chargers" is found.
	*/

	const matchingSearchResults = []
	for (const item of searchResults) {
		const propertyToTerm = {}
		for (const term in item.match)
			for (const prop of item.match[term]) {
				propertyToTerm[prop] = propertyToTerm[prop] || {}
				propertyToTerm[prop][term] = 1 // truthy for filtering later
			}

		let passes
		for (const { words, regex } of phrases) {
			// Make sure the whole phrase is present, since MiniSearch can
			// return results that don't contain every word.
			if (!words.every(w => item.terms.includes(w))) {
				passes = false
				break
			}

			// Must have at least one property that contains every term.
			const propertiesContainingAllWords = Object
				.keys(propertyToTerm)
				.filter(prop => words.every(word => propertyToTerm[prop][word]))
			if (!propertiesContainingAllWords.length) {
				passes = false
				break
			}

			// And one of those properties needs to match all words being together.
			if (propertiesContainingAllWords.find(prop => regex.test(item[prop]))) {
				passes = true
			} else {
				passes = false
				break
			}
		}
		if (passes) matchingSearchResults.push(item)
	}

	return matchingSearchResults
}
