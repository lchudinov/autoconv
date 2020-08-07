import typescript from 'rollup-plugin-typescript';

export default {
  input: './src/main.ts',
  output: {
    file: 'lib/autoconv.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    typescript(),
  ]
}