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
the query parameters and hands them to SearchMD directly.

*/

import { search } from './build/search.js'
import { loadAllFiles } from './build/loader.js'

let s

export const handler = async event => {
	if (!s) s = search({ loadAllFiles })
	const { results } = await s(event)
	return {
		statusCode: 200,
		body: JSON.stringify(results),
		headers: { 'content-type': 'application/json' },
	}
}
