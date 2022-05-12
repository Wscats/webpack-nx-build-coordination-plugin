# Incremental Builds

After you cloned the repo, run:

## Running without tsc -b -w

1. `nx serve nextapp`
2. Open `header.ts`, change something, and see it being reflected.

By default, the serve command is going to run `tsc -b` without -w. I did it this way cause it was the easiest way to show how it all works.

Note, that the `dist` folder should contain `tsconfig.tsbuildinfo` files. They should be cached, to speed up ts execution, so local dev will benefit from the CI stuff.

The repo hardcodes references between projects. Instead, a custom Nx executor should use the provided project graph to generate those. It's easy to do. We do similar things for other tools and even for tsconfig path mappings.

## Running with tsc -b -w

Open next.config.js and comment out the following line:

```js
plugins: [...config.plugins, new WebpackNxBuildCoordinationPlugin("tsc -b apps/nextapp/tsconfig.json", "libs")],
# OR
# options see: https://www.npmjs.com/package/chokidar
plugins: [...config.plugins, new WebpackNxBuildCoordinationPlugin("tsc -b apps/nextapp/tsconfig.json", "libs", [options])],
```

Run `nx buildlibs nextapp` in one terminal and `nx serve nextapp` in another one. `nx buildlibs nextapp` will run tsc with watch, so it's super fast. In a real setup, WebpackNxBuildCoordinationPlugin should run the watch command, look at output, and do the synchronization, same was WebpackNxBuildCoordinationPlugin does it right now. It's not super hard, but it requires a bit more work.

## Handling Non-TS Files

If you handle non-ts files, you can have a watch that invokes a target on a lib, and it will copy the files where they belong. You can also inline them into the JS output if you write a TS transformer.
