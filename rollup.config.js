import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  entry: 'src/Leaflet.Emoji.js',
  format: 'iife',
  dest: 'dist/Leaflet.Emoji.js',
  plugins: [
    resolve({
      jsnext: true
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ]
};
