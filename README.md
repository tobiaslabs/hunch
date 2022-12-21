# My `npm init` Folder

```sh
mkdir my-lib
cd my-lib
# then
npx degit saibotsivad/init
npm install --save-dev bundt uvu
```

***Before opening in WebStorm!!!***

You must resolve the `TODO` inside [./.idea/modules.xml](.idea/modules.xml) ***and*** rename [./.idea/TODO_REPO_NAME.iml](.idea/TODO_REPO_NAME.iml) to the project name, or WebStorm will complain. Hard.

Inside the folder, do a search for:

```
TODO_
```

And go rename the things.

Finally, delete everything above these dashes:

---

# {{TODO_REPO_NAME}}

{{TODO_DESCRIPTION}}

## Example

Describe general use example

## api: `function({ param1: Type, param2: Type })`

Describe api

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software={{TODO_REPO_NAME}}).
