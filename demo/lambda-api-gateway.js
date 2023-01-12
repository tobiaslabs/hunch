/*

This is an example of what a Lambda might look like, if it were
handling events from an AWS API Gateway.

---------------------------------------------------------------

Event triggers from the API Gateway look something like this:

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

In your Lambda you may want to do things like your own query parameter
normalization and validation, or some massaging of the search results
before you send them back.

This simple implementation doesn't do any of that, it just takes
the query parameters and hands them to Hunch directly.

*/

import { readFile } from 'node:fs/promises'
import { hunch } from '../dist/hunch.js'
import { fromQuery } from '../dist/from-query.js'

let search

export const handler = async event => {
	if (!search) search = hunch({
		index: JSON.parse(await readFile('./build/hunch.json', 'utf8')),
	})
	return {
		statusCode: 200,
		body: JSON.stringify(search(fromQuery(event.queryStringParameters))),
		headers: { 'content-type': 'application/json' },
	}
}

// Here we're simulating an API Gateway call to the Lambda, just to
// assert that it works.
const response = await handler({
	queryStringParameters: {
		q: 'you know what I like about cats',
		'facets[tags]': 'cats,-dogs',
	},
})
console.log('Output from the AWS Lambda:', JSON.parse(response.body))
