// This is an example of what an event trigger to a Lambda from
// an AWS API Gateway might look like:
const event = {
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

// Here we are dynamically importing the Lambda code only so that
// our own tests don't pick up cached JSON files from previous
// builds. In practice, Lambda runtime execution is handled
// quite differently than this demo.
const { handler } = await import ('./lambda.js')
const response = await handler(event)
console.log('Lambda Status:', response.statusCode)
// Note that the Lambda needs to return a string body, so here
// we are just doing a little JSON mashing to get the console
// logs to look nicer.
console.log('Lambda Body:', JSON.stringify(JSON.parse(response.body), undefined, 4))
