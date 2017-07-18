import { readFileSync } from 'fs';
import { basename, dirname } from 'path';
import * as webpack from 'webpack';

export class PackageManifestWebpackPlugin {
  constructor(private packageManifestPaths: string[]) {}

  apply(compiler: webpack.Compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      const rootPackageManifest = JSON.parse(readFileSync('./package.json').toString());

      for (const packageManifestPath of this.packageManifestPaths) {
        const sourcePackageManifest = JSON.parse(readFileSync(packageManifestPath).toString());
        const mergedPackageManifest = this.mergePackageManifests(rootPackageManifest, sourcePackageManifest);
        const mergedPackageManifestJson = JSON.stringify(mergedPackageManifest, undefined, 2);
        const distPath = `${basename(dirname(packageManifestPath))}/package.json`;

        compilation.assets[distPath] = {
          source: () => mergedPackageManifestJson,
          size: () => mergedPackageManifestJson.length
        };
      }

      callback();
    });
  }

  private mergePackageManifests(rootPackageManifest: any, sourcePackageManifest: any) {
    return {
      name: sourcePackageManifest.name,
      version: rootPackageManifest.version,
      main: sourcePackageManifest.main,
      bin: sourcePackageManifest.bin,
      author: rootPackageManifest.author,
      contributors: rootPackageManifest.contributors,
      license: rootPackageManifest.license,
      repository: rootPackageManifest.repository,
      bugs: rootPackageManifest.bugs,
      homepage: rootPackageManifest.homepage,
      dependencies: Object.keys(sourcePackageManifest.dependencies)
        .reduce((dependencies, dependency) => ({ ...dependencies, [dependency]: rootPackageManifest.dependencies[dependency] }), { })
    };
  }
}
