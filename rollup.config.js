import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import importAssets from 'rollup-plugin-import-assets';

export default {
  input: 'src/index.tsx',
  output: {
    file: 'dist/index.js',
    format: 'iife',
    exports: 'default',
    name: 'plugin',
    globals: {
      'react': 'window.SP_REACT',
      'react-dom': 'window.SP_REACTDOM',
      'decky-frontend-lib': 'window.DFL'
    },
    sourcemap: true
  },
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    json(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    importAssets({}),
    {
      name: 'remove-var-plugin',
      renderChunk(code) {
        return {
          code: code.replace(/^var plugin\s*=\s*/, ''),
          map: null
        };
      }
    }
  ],
  external: [
    'react',
    'react-dom',
    'decky-frontend-lib'
  ]
};
