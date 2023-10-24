const _log = (level, message, args) => {
	const prefix = `[${new Date().toISOString()}]`
	// eslint-disable-next-line no-console
	if (args.length) console[level](prefix, message, ...args)
	// eslint-disable-next-line no-console
	else console[level](prefix, message)
}

export const logger = {
	info: (message, ...args) => _log('info', message, args),
	warn: (message, ...args) => _log('warn', message, args),
	error: (message, ...args) => _log('error', message, args),
}
