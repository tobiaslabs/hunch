import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { snipContent } from '../src/utils/snip-content.js'

test('snip content', () => {
	assert.equal(
		snipContent(
			{
				q: 'middle',
				snippet: {
					foo: 'middle'.length,
				},
			},
			{
				foo: 'dawn middle foot',
			}),
		{
			foo: 'middle',
			_snippet: {
				foo: {
					before: 'dawn '.length,
					after: ' foot'.length,
				},
			},
		},
		'middle out',
	)
	assert.equal(
		snipContent(
			{
				q: 'dawn',
				snippet: {
					foo: 'dawn'.length,
				},
			},
			{
				foo: 'dawn middle foot',
			}),
		{
			foo: 'dawn',
			_snippet: {
				foo: {
					before: 0,
					after: ' middle foot'.length,
				},
			},
		},
		'start of string',
	)
	assert.equal(
		snipContent(
			{
				q: 'foot',
				snippet: {
					foo: 'foot'.length,
				},
			},
			{
				foo: 'dawn middle foot',
			}),
		{
			foo: 'foot',
			_snippet: {
				foo: {
					before: 'dawn middle '.length,
					after: 0,
				},
			},
		},
		'start of string',
	)
	assert.equal(
		snipContent(
			{
				q: 'middle',
				snippet: {
					foo: 'middle'.length + 1,
				},
			},
			{
				foo: 'dawn middle foot',
			}),
		{
			foo: 'middle',
			_snippet: {
				foo: {
					before: 'dawn '.length,
					after: ' foot'.length,
				},
			},
		},
		'middle out with the snippet over size',
	)
	assert.equal(
		snipContent(
			{
				q: 'dawn',
				snippet: {
					foo: 'dawn'.length + 1,
				},
			},
			{
				foo: 'dawn middle foot',
			}),
		{
			foo: 'dawn',
			_snippet: {
				foo: {
					before: 0,
					after: ' middle foot'.length,
				},
			},
		},
		'start with the snippet over size',
	)
	assert.equal(
		snipContent(
			{
				q: 'foot',
				snippet: {
					foo: 'foot'.length + 1,
				},
			},
			{
				foo: 'dawn middle foot',
			}),
		{
			foo: 'foot',
			_snippet: {
				foo: {
					before: 'dawn middle '.length,
					after: 0,
				},
			},
		},
		'end with the snippet over size',
	)
	assert.equal(
		snipContent(
			{
				q: 'fizz',
				snippet: {
					foo: 6,
				},
			},
			{
				foo: '  fizz bar buzz  ',
			}),
		{
			foo: 'fizz',
			_snippet: {
				foo: {
					before: 0,
					after: ' bar buzz  '.length,
				},
			},
		},
		'word boundaries at beginning are not counted',
	)
	assert.equal(
		snipContent(
			{
				q: 'buzz',
				snippet: {
					foo: 6,
				},
			},
			{
				foo: '  fizz bar buzz  ',
			}),
		{
			foo: 'buzz',
			_snippet: {
				foo: {
					before: '  fizz bar '.length,
					after: 0,
				},
			},
		},
		'word boundaries at end are not counted',
	)
	assert.equal(
		snipContent(
			{
				q: 'bar',
				snippet: {
					foo: 0,
				},
			},
			{
				foo: 'fizz bar buzz',
			}),
		{
			foo: '',
		},
		'when snippet size is 0 no chars are returned and _snippet is not set',
	)
})

test.run()
