import watch from 'node-watch';
import { execSync } from 'child_process';

export class WebpackNxBuildCoordinationPlugin {
  private currentlyRunning: 'none' | 'nx-build' | 'webpack-build' = 'none';

  constructor(
    private readonly buildCmd: string | (() => string),
    private readonly projectsFolderToWatch: string
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
    watch(this.projectsFolderToWatch, { recursive: true }, async () => {
      await this.buildChangedProjects();
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
