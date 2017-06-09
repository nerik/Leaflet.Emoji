import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  entry: 'demos/emoji-land/emoji-land.js',
  format: 'iife',
  dest: 'demos/emoji-land/emoji-land.dist.js',
  plugins: [
    resolve({
      jsnext: true
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ]
};
