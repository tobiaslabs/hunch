export const pick = (obj, keys) => {
	const out = {}
	for (const key of keys) if (obj[key] !== undefined) out[key] = obj[key]
	return out
}
