# Changelog

## 0.16.0

### Minor Changes

- b396f69: Failure in metadata normalization will log with filename.

## 0.15.0

### Minor Changes

- 677527d: Add indexingFilter to remove from index at very end of pipe.

## 0.14.1

### Patch Changes

- daf1ccc: Allow output to be false explicitly in more places.

## 0.14.0

### Minor Changes

- 4e0527b: Add ability to skip index creation, and pass finalized record as `record` to `saveFile`.

## 0.13.0

### Minor Changes

- bde422e: Change to logged output for easier debugging and benchmarking, and handle case where faceted values are invalid by dropping them instead of throwing.

### Patch Changes

- fcdd0e1: Handle `null` values more gracefully.
- 4a83f61: Including fields and facets is now allowed to be empty.

## 0.12.0

### Minor Changes

- ac1ff9b: Add "files" to the API of "saveSite".

## 0.11.0

### Minor Changes

- 8a1cf29: Added official support for MS Windows. Pull requests now run the demo on a Windows machine as a general validation that everything works on that OS. The only bug was resolved by https://github.com/nodejs/node/issues/34765

### Patch Changes

- 8a1cf29: Added initial benchmark for testing purposes and found some inaccuracies in the `huge-text-search` pre-test text generation.

## 0.10.3

### Patch Changes

- e05df13: Update to fatal error logging.

## 0.10.2

### Patch Changes

- 3fa99b7: Correction to the included matches stuff.

## 0.10.1

### Patch Changes

- 44a22ab: Use the dist, Luke!

## 0.10.0

### Minor Changes

- aa94eb5: Add ability to include matching terms on returned results.
- 4ddc05f: Snippets are now slightly context aware and let you know if there are words before or after the result string.
- 60c65f4: Always return \_chunks instead of \_chunk

## 0.9.0

### Minor Changes

- 4b40804: Change normalizeMetadata to formatMetadata and add YAML parser options.
- c48cba7: Add ability to format and ability to save files

## 0.8.0

### Minor Changes

- 75b8d62: Add ability to tokenize content prior to indexing.

## 0.7.1

### Patch Changes

- 77d06f8: Rename the "quoted-search" test to "exact-phrase".
- 882f0fa: Small update to the server logs to look nicer.
- a78143d: Fixed unpacking algorithm for multiple chunks.
- a917b9d: Add demo test for how multiple chunks are searched.

## 0.7.0

### Minor Changes

- dd20cda: Prettify logged query parameters when running local dev server.
- 04dc1a6: You can set `--delay N` when using `--serve` to simulate slow network responses.
- 27fedf4: Add ability to filter with quotation marks describing exact matches.

### Patch Changes

- e0b15e8: Add tests for very large data sets to validate performance is acceptable.

## 0.6.1

### Patch Changes

- a26cbca: Query serializer was not handling multiple facet match exclude/match-any values.

## 0.6.0

### Minor Changes

- aecbe72: Add functionality for inclusive facet matching.

### Patch Changes

- f828d9e: Fix docs to match now that Hunch has settled down.

## 0.5.0

### Minor Changes

- bf2fcd7: There is now a default sort function. To change, you must override.
- 823bed6: Change returned facet map to include count of all versus search result.
- 77d3bb7: Add ability to return sparse results.
- 079f9bd: The canonical query parameter "sort" is now set, instead of anything-goes.
- 668775b: Add functionality to return only limited fields.

## 0.4.0

### Minor Changes

- 7aa6927: You can pass in the `--serve` flag to get a simple HTTP server, using canonical query parameters.
- ebd2ab1: You can pass in `--watch` and the index will be rebuilt on content changes.

## 0.3.2

### Patch Changes

- 5910916: Make sure sort query parameter is passed along untouched.

## 0.3.1

### Patch Changes

- 6fe9f33: Passing 0 to pagination and snippet size is allowed and supported.

## 0.3.0

### Minor Changes

- 2371232: Change the query normalization name, but also add a helper function to turn a HunchJS query object into a query search string.

  What you'll need to do to update:

  ### Change imports

  ```js
  import { normalize } from "hunch";
  // =>
  import { fromQuery } from "hunch";
  ```

  ```js
  import { normalize } from "hunch/normalize";
  // =>
  import { fromQuery } from "hunch/from-query";
  ```

### Patch Changes

- 90a3be4: Refactor pagination to make it testable, then add tests and optimize.

## 0.2.0

### Minor Changes

- e5a8580: Add functionality to support "snippet" searching, e.g. return partial documents.

### Patch Changes

- 946c1c0: Add testing for query parameter normalization and fix by-id and pagination errors in normalization.

## 0.1.2

### Patch Changes

- ded3b8f: Point the CLI back to the dist folder. 🤦‍♂️

## 0.1.1

### Patch Changes

- 1680508: The metadata normalization function can be asynchronously called, and is called with an object containing the metadata and blocks list.
- 34c409a: The CLI configuration was incorrect in pointing to a CommonJS file. This has been fixed, and some additional logging details were added.

## 0.1.0

### Minor Changes

- 1965433: Add a CLI to run HunchJS from the command line.
- b09cd39: Refactor the generator so file writing is part of the CLI, not core to the generator.

## 0.0.5

### Patch Changes

- 2477884: still trying to get changeset auto publishing to npm

## 0.0.4

### Patch Changes

- ade9fa2: adding changeset to make release cycle easier

## [0.0.0-alpha.1](https://github.com/tobiaslabs/hunch/tree/v0.0.0-alpha.1) - 2022-12-21

### Added

- (Not published to npm.) Created the base project from [saibotsivad/init](https://github.com/saibotsivad/init).

[unreleased]: https://github.com/tobiaslabs/hunch/compare/v0.0.0...HEAD
[0.0.1]: https://github.com/tobiaslabs/hunch/compare/v0.0.0...v0.0.1
