import fs from 'fs'
import path from 'path'
import license from 'rollup-plugin-license'
import { uglify } from 'rollup-plugin-uglify'
import packageConf from './package.json'
import baseConf from './rollup.config.base'

const isWatch = process.env.BUILD_ENV === 'watch'

const formats = ['es', 'umd']

function getEntries() {
  const reg = /\.js$/
  return fs
    .readdirSync(path.resolve(__dirname, './src'))
    .filter(
      filename =>
        reg.test(filename) &&
        !fs.statSync(path.resolve(__dirname, './src', filename)).isDirectory(),
    )
    .map(filename => ({
      name: filename.replace(reg, ''),
      filename: path.resolve(__dirname, './src', filename),
      formats: formats.filter(f => f !== 'es'),
    }))
}

const conf = entry => ({
  input: entry.filename,
  output: entry.formats.map(format => ({
    file: `./lib/${format}/${entry.name}.js`,
    format,
    name: entry.name === 'index' ? 'MusicPlayer' : `${entry.name}MusicPlayer`,
  })),
  external: entry.external ? Object.keys(packageConf.dependencies || {}) : [],
  plugins: [
    ...baseConf.plugins,
    entry.needUglify !== false && uglify(),
    license({
      banner: `Bundle of <%= pkg.name %>
               Generated: <%= moment().format('YYYY-MM-DD') %>
               Version: <%= pkg.version %>
               License: <%= pkg.license %>
               Author: <%= pkg.author %>`,
    }),
  ],
})

export default isWatch
  ? [
      {
        name: 'index',
        filename: './src/index.js',
        formats: ['umd'],
        needUglify: false,
      },
    ].map(conf)
  : [
      {
        name: 'index',
        filename: './src/index.js',
        formats: ['es'],
        needUglify: false,
        external: true,
      },
      {
        name: 'index',
        filename: './src/index.ts',
        formats: ['umd'],
        needUglify: true,
        external: false,
      },
      ...getEntries(),
    ].map(conf)
