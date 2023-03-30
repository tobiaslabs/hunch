import { createServer } from 'node:http'
import { setTimeout as timeoutDelay } from 'node:timers'

import { fromQuery } from '../from-query.js'
import { hunch } from '../hunch.js'

const prettify = url => {
	let [ pre, query ] = url.split('?')
	query = query || ''
	const parts = []
	for (const chunk of query.split('&')) {
		const [ key, value ] = chunk.split('=')
		parts.push(`${decodeURIComponent(key)}=${decodeURIComponent(value)}`)
	}
	query = parts.sort().join('&')
	return pre + (query ? ('?' + query) : '')
}

const HOSTNAME = '127.0.0.1'
let server
export const startServer = ({ port, index, delay }) => {
	if (server) server.close(() => {
		console.log('HunchJS server restarting due to index changes...')
		server = undefined
		setTimeout(() => { startServer({ port, index, delay }) })
	})
	else {
		const search = hunch({ index })
		server = createServer((req, res) => {
			console.log(new Date(), req.method, prettify(req.url))
			const { searchParams } = new URL(`https://${HOSTNAME}${req.url}`)
			let body
			let statusCode = 200
			try {
				const query = fromQuery(searchParams)
				body = search(query)
			} catch (error) {
				statusCode = 500
				body = {
					error: {
						name: error.constructor?.name || error.name,
						message: error.message,
					},
				}
			}
			timeoutDelay(() => {
				res.setHeader('content-type', 'application/json')
				res.statusCode = statusCode
				res.end(JSON.stringify(body, undefined, 4))
			}, delay)
		})
		server.listen(port, () => {
			console.log(`HunchJS server running: http://${HOSTNAME}:${port}/`)
		})
	}
}
