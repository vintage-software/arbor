import { readFileSync } from 'fs';
import * as webpack from 'webpack';

export class PackageManifestWebpackPlugin {
  constructor(private packageManifestPath: string) {}

  apply(compiler: webpack.Compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      const rootPackageManifest = JSON.parse(readFileSync('./package.json').toString());
      const sourcePackageManifest = JSON.parse(readFileSync(this.packageManifestPath).toString());

      const mergedPackageManifest = this.mergePackageManifests(rootPackageManifest, sourcePackageManifest);

      const mergedPackageManifestJson = JSON.stringify(mergedPackageManifest, undefined, 2);

      compilation.assets['package.json'] = {
        source: () => mergedPackageManifestJson,
        size: () => mergedPackageManifestJson.length
      };

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
