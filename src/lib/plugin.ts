import { watch, WatchOptions } from 'chokidar';
import { execSync } from 'child_process';

export class WebpackNxBuildCoordinationPlugin {
  private currentlyRunning: 'none' | 'nx-build' | 'webpack-build' = 'none';

  constructor(
    private readonly buildCmd: string | (() => string),
    private readonly projectsFolderToWatch: string,
    private readonly options?: WatchOptions
  ) {
    this.buildChangedProjects();
    this.startWatchingBuildableLibs();
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapPromise(
      'IncrementalDevServerPlugin',
      async () => {
        while (this.currentlyRunning === 'nx-build') {
          await sleep(50);
        }
        this.currentlyRunning = 'webpack-build';
      }
    );
    compiler.hooks.done.tapPromise('IncrementalDevServerPlugin', async () => {
      this.currentlyRunning = 'none';
    });
  }

  startWatchingBuildableLibs() {
    const watcher = watch(this.projectsFolderToWatch, {
      cwd: process.cwd(),
      ignoreInitial: true,
      ...this.options,
    });

    watcher.on('all', (_event: string, path: string) => {
      this.buildChangedProjects();
    });
  }

  async buildChangedProjects() {
    while (this.currentlyRunning === 'webpack-build') {
      await sleep(50);
    }
    this.currentlyRunning = 'nx-build';
    try {
      execSync(typeof this.buildCmd === 'function' ?
        this.buildCmd() : this.buildCmd, { stdio: [0, 1, 2] });
      // eslint-disable-next-line no-empty
    } catch (e) {
    }
    this.currentlyRunning = 'none';
  }
}

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
