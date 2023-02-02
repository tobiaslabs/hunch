import { fromQuery } from '../from-query.js'
import { hunch } from '../hunch.js'

import { createServer } from 'node:http'

const HOSTNAME = '127.0.0.1'
let server
export const startServer = ({ port, index }) => new Promise(() => {
	if (server) server.close(() => {
		console.log('HunchJS server restarting due to index changes...')
		server = undefined
		setTimeout(() => { startServer({ port }) })
	})
	else {
		const search = hunch({ index })
		server = createServer((req, res) => {
			console.log(new Date(), req.method, req.url)
			const { searchParams } = new URL(`https://${HOSTNAME}${req.url}`)
			let body
			let statusCode = 200
			res.setHeader('content-type', 'application/json')
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
			res.statusCode = statusCode
			res.end(JSON.stringify(body, undefined, 4))
		})
		server.listen(port, () => {
			console.log(`HunchJS server running: http://${HOSTNAME}:${port}/`)
		})
	}
})
