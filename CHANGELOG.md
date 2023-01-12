# Changelog

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
