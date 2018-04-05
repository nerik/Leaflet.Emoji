import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'demos/emoji-city/emoji-city.js',
  output: {
    file: 'demos/emoji-city/emoji-city.dist.js',
    format: 'iife'
  },
  plugins: [
    resolve({
      jsnext: true
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ]
};
