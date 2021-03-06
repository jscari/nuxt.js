import webpack from 'webpack'
import chalk from 'chalk'
import _ from 'lodash'
import logUpdate from 'log-update'

const sharedState = {}

const BAR_LENGTH = 25
const IS_WINDOWS = /^win/.test(process.platform)
const BLOCK_CHAR = IS_WINDOWS ? ' ' : '█'
const BLOCK_CHAR2 = IS_WINDOWS ? '=' : '█'
const ICON_CHAR = IS_WINDOWS ? ':' : '⠸'
const BAR_BEFORE = IS_WINDOWS ? chalk.grey('[') : ''
const BAR_AFTER = IS_WINDOWS ? chalk.grey(']') : ''

export default class ProgressPlugin extends webpack.ProgressPlugin {
  constructor(options) {
    super(options)

    this.handler = (percent, msg, ...details) => this.updateProgress(percent, msg, details)

    this.handler = _.throttle(this.handler, 25, { leading: true, trailing: true })

    this.options = options

    if (!sharedState[options.name]) {
      sharedState[options.name] = {
        color: options.color
      }
    }
  }

  apply(compiler) {
    super.apply(compiler)

    compiler.hooks.done.tap('progress', () => logUpdate.clear())
  }

  get state() {
    return sharedState[this.options.name]
  }

  updateProgress(percent, msg, details) {
    const progress = Math.floor(percent * 100)

    this.state.progress = progress
    this.state.msg = (msg && msg.length) ? msg : 'wait'

    // Process all states
    let inProgress = false

    const lines = []

    _.sortBy(Object.keys(sharedState), s => s.name).forEach(name => {
      const state = sharedState[name]

      if (state.progress < 100) {
        inProgress = true
      }

      const _color = chalk.keyword(state.color)

      const _icon = _color(ICON_CHAR)
      const _name = _color(_.startCase(name))
      const _bar = this._renderBar(state.progress, state.color)
      const _msg = chalk.grey(_.startCase(state.msg))
      const _progress = chalk.grey('(' + state.progress + '%)')

      lines.push([_icon, _name, _bar, _msg, _progress].join(' '))
    })

    if (!inProgress) {
      logUpdate.clear()
    } else {
      logUpdate('\n' + lines.join('\n') + '\n')
    }
  }

  _renderBar(progress, color) {
    const w = progress * (BAR_LENGTH / 100)
    const bg = chalk.white(BLOCK_CHAR)
    // const fg = chalk.keyword(color)(BLOCK_CHAR)

    const base = color === 'green' ? 120 : 50
    const fg = i => chalk.hsl(i * 3 + base, 100, 50)(BLOCK_CHAR2)

    return BAR_BEFORE + _.range(BAR_LENGTH).map(i => i < w ? fg(i) : bg).join('') + BAR_AFTER
  }
}
