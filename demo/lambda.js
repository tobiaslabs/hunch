/*

This is an example of what a Lambda might look like, if it were
handling events from an AWS API Gateway.

Event triggers from those look something like this:

	{
		resource: '/',
		path: '/',
		httpMethod: 'GET',
		requestContext: {
			resourcePath: '/search',
			httpMethod: 'GET',
			path: '/MyGateway/',
		},
		headers: {
			accept: 'application/json',
		},
		queryStringParameters: {
			q: 'search query',
		},
	}

In your Lambda you may want to do things like query parameter
normalization and validation, or some massaging of the search
results before you send them back.

This simple implementation doesn't do any of that, it just takes
the query parameters and hands them to Slams directly.

*/

import { search } from './build/search.js'
import { loadChunks } from './build/loader.js'

export const handler = async event => {
	const { results } = await search(event.queryStringParameters)
	const chunks = await loadChunks(results)
	return {
		statusCode: 200,
		body: JSON.stringify({ results, chunks }),
		headers: { 'content-type': 'application/json' },
	}
}
