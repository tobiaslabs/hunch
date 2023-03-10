export default ({ assert, hunch, index }) => [
	() => {
		assert.equal(
			hunch({ index })({
				q: 'arch',
				suggest: true,
			}),
			{
				suggestions: [
					{ q: 'archery', score: 0.489 },
					{ q: 'archibald', score: 0.473 },
				],
			},
			'does not suggest "march" since not same prefix',
		)
	},
]
