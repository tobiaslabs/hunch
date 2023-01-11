---
"hunch": minor
---

Change the query normalization name, but also add a helper function to turn a HunchJS query object into a query search string.

What you'll need to do to update:

### Change imports

```js
import { normalize } from 'hunch'
// =>
import { fromQuery } from 'hunch'
```

```js
import { normalize } from 'hunch/normalize'
// =>
import { fromQuery } from 'hunch/from-query'
```
