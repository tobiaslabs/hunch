# Hunch Feature Tests

The testing framework is relatively simple but home-grown.

To add a test for a feature, look in the [feature](./feature) folder for the named feature.

In each feature folder there is a named test set, identified by `$NAME.test.js`, with the following named files:

- `$NAME.config.js` - The HunchJS configuration for that feature test. The following properties are overwritten by the test framework:
  - `cwd` - Set to be the feature folder.
  - `indent` - This option makes the output JSON easier to read for debugging purposes.
  - `input` - Set to be the folder `content-$NAME` for that test.
  - `output` - All test outputs go to `build/$NAME.json` for the test.
- `$NAME.test.js` - This is the file that holds the actual assertions for that test. It needs to `default` export a *synchronous* function that returns an array of callable synchronous functions. The default export function is called with two positional variables:
  - `assert` - The assertions, e.g. [from `uvu`](https://github.com/lukeed/uvu/blob/master/docs/api.assert.md).
  - `search` - The instantiated Hunch search function.
- `content-$NAME/` - The folder to contain all content for the named test.

Inside each test file, you should make search requests and then assert the results that are relevant to the thing you are testing, e.g.:

```js
export default (assert, search) => [
	() => {
		const results = search({ q: 'hello' })
		assert.equal(results.items, 7, 'not all content has "hello"')
	},
]
```

In the "basic" tests, try to assert the full result set at least once, because the feature tests also serve as examples and are linked to from other documentation.
