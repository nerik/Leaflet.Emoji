import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  entry: 'demos/emoji-city/emoji-city.js',
  format: 'iife',
  dest: 'demos/emoji-city/emoji-city.dist.js',
  plugins: [
    resolve({
      jsnext: true
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ]
};
