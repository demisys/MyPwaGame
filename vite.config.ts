// vite.config.js
import { defineConfig } from 'vite'

import fs from 'fs'
import { resolve } from 'path'
import compressing from 'compressing';

export interface CompressOptions<Type extends "zip" | "tar" | "tgz"> {
  archiverName?: ArchiverName<Type>;
  type: Type;
  sourceName?: string;
}
type ArchiverName<T> = T extends "zip" | "tar"
  ? `${string}.${T}`
  : T extends "tgz"
  ? `${string}.tar.gz`
  : never;

const initOpts: CompressOptions<"tgz"> = {
  archiverName: "dist.tar.gz",
  type: "tgz",
  sourceName: "dist",
};

const prod = process.env.NODE_ENV == 'production';

function compressDist(
  opts?: CompressOptions<"zip" | "tar" | "tgz">
) {
  const { sourceName, archiverName, type } = opts || initOpts;
  return {
    name: "compress-dist",
    closeBundle() {
      const rootPath = process.cwd();
      const sourcePath = resolve(rootPath, sourceName);
      // console.log(`sourcePath: ${sourcePath}`);

      const destStream = fs.createWriteStream(resolve(rootPath, archiverName));
      const sourceStream = new compressing[type].Stream();

      destStream.on("finish", () => {
        console.log(`compress-dist:  ${sourceName} compress completed!`)
        fs.renameSync(archiverName, `${sourceName}/${archiverName}`)
      });

      destStream.on("error", (err) => {
        throw err;
      });

      sourceStream.addEntry(sourcePath);
      sourceStream.pipe(destStream);
    },
  };
}

export default defineConfig({
  //appType: 'custom',
  appType: 'mpa',
  publicDir: 'public',
  assetsInclude: ['./assets/*'],
  build: {
    // minify: true, // TODO: minify?
    // minify: false,
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        main: 'index.html',
        workaround: 'workaround.html',
        game: 'game.html',
        sw: 'sw.js'
      },
      output: {
        // dir: 'dist',
        // chunkFileNames: 'pepega',
        // format: 'esm',

        // Disable versioning hash for easier access to chunk from import map.
        chunkFileNames: 'chunks/[name].js',

        entryFileNames: (chunk)=>{
          console.log(chunk.name)

          // Keep sw.js in root directory so it matches service worker scope.
          if (chunk.name == 'sw') return 'sw.js'

          return 'assets/[name]-[hash].js'
        },

        manualChunks: {
          'babylon': [
            // '@babylonjs/core',
            'src/babylon.ts',
          ],
          // 'typescript': [
          //   'typescript'
          // ]
        },
      },
      plugins: [
        compressDist({
          // archiverName: 'dist.tar.gz',
          // type: 'tgz',
          archiverName: 'dist.zip',
          type: 'zip',
          sourceName: 'dist',
        }),
      ]
    }
  },
  esbuild: {
    include: ['src/**/*.ts']
  },
  resolve: {
    alias: {
      '@assets': '/assets',
      '@public': '/public',
      '@modules': '/node_modules'
    }
  },
  define: {
    // Workaround for '@babel/types' using process.env
    // 'process.env': JSON.stringify({}),
    // Workaround for '@babel/generator' using nodejs buffer
    "process.env.BABEL_TYPES_8_BREAKING": JSON.stringify(true), // TODO: Is JSON needed?
    "Buffer.isBuffer": JSON.stringify(v=>false),
    ["__BABYLON"+"_CHUNK__"]: JSON.stringify(prod ? "/chunks/babylon.js" : "/src/babylon")
  }
})