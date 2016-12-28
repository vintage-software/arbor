# Arbor
A CLI tool to build projects across several platforms in parallel.

Run `npm install -g arbor` to install. Create a `arbor.json` file with specified tasks. 
Run `arbor --run build` command, this will run the build task of all project recursively in the directory.
Ex: `cd my-repos && arbor --run build` builds all of the repos/projects in `my-repos` directory.

- `npm install && npm start` to start project 
- run `npm link` to link to global `arbor` see: [https://docs.npmjs.com/cli/link](https://docs.npmjs.com/cli/link)

## Example arbor.json
``` javascript
{
  "name": "My Node Project",
  "tasks": {
    "build": "npm run build",
    "test": "npm run test"
  }
}
```

``` javascript
{
  "name": "My .NET Project",
  "tasks": {
    "build": "msbuild",
  }
}
```

![CLI](arbor.gif)