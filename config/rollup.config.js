import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/Leaflet.Emoji.js',
  output: {
    file: 'dist/Leaflet.Emoji.js',
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
