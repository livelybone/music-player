import baseConf from './rollup.config.base'

const conf = entry => ({
  ...baseConf,
  input: entry.filename,
  output: entry.formats.map(format => ({
    file: `./test-lib/${entry.name}.js`,
    format,
    name: 'MusicPlayer',
  })),
  plugins: [
    ...baseConf.plugins,
  ],
})

export default conf({
  name: 'index',
  filename: './src/index.js',
  formats: ['umd'],
})
