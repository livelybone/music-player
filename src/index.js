import { DragMove } from '@livelybone/mouse-events'
import { getRect } from '@livelybone/scroll-get'
import { blobToBase64 } from 'base64-blob'
import { getAvatar } from './avatars'
import { formatTime } from './time'
import { stopPropagation } from './utils'

function getEl(id) {
  return document.getElementById(id)
}

function getClass(el) {
  const attr = el.getAttribute('class')
  if (attr && typeof attr === 'object') return attr.baseVal || ''
  return attr || ''
}

function addClass(el, className) {
  const oldClassName = getClass(el)
  const reg = new RegExp(`(^|\\s+)${className}($|\\s+)`, 'g')
  const alreadyHas = reg.test(oldClassName)
  if (!alreadyHas) el.setAttribute('class', `${oldClassName} ${className}`)
}

function removeClass(el, className) {
  const oldClassName = getClass(el)
  const reg = new RegExp(`(^|\\s+)${className}($|\\s+)`, 'g')
  const alreadyHas = reg.test(oldClassName)
  if (alreadyHas) el.setAttribute('class', oldClassName.replace(reg, ' '))
}

function toggleClass(el, className) {
  const oldClassName = getClass(el)
  const reg = new RegExp(`(^|\\s+)${className}($|\\s+)`, 'g')
  const alreadyHas = reg.test(oldClassName)
  if (alreadyHas) el.setAttribute('class', oldClassName.replace(reg, ' '))
  else el.setAttribute('class', `${oldClassName} ${className}`)
}

export default class MusicPlayer {
  constructor() {
    this.audioEl = getEl('audio')
    this.fileListWapper = getEl('file-list-wrapper')
    this.fileListEl = getEl('file-list')
    this.addFileEl = getEl('add-file')
    this.avatarEls = [getEl('l-avatar'), getEl('avatar')]
    this.filenameEl = getEl('name')
    this.animationEl = getEl('animation')

    this.btnEls = {
      prev: getEl('btn-pre'),
      next: getEl('btn-next'),
      playPause: getEl('btn-pause-play'),
      play: getEl('btn-play'),
      pause: getEl('btn-pause'),
      menu: getEl('btn-menu'),
    }

    this.processBarEl = {
      bar: getEl('process-bar'),
      times: getEl('times'),
    }

    this.files = []

    const windowWidth = window.innerWidth
    const pointerWidth = getRect(this.processBarEl.times).width
    this.maxLeft = windowWidth - pointerWidth
    this.prevLeft = 0

    this.playTimer = null

    this.currFile = null

    this.listenBtnElsOperators()
    this.listenDragAndRecognize()
    this.listenAddAudio()
    this.listenProcessBar()
  }

  /**
   * 监听按钮操作
   * */
  listenBtnElsOperators() {
    this.btnEls.prev.addEventListener('click', () => {
      this.currFileChange(this.getFileByStep(-1))
      this.play()
    })
    this.btnEls.next.addEventListener('click', () => {
      this.currFileChange(this.getFileByStep(1))
      this.play()
    })
    this.btnEls.play.addEventListener('click', () => {
      this.play()
    })
    this.btnEls.pause.addEventListener('click', () => {
      this.pause()
    })
    this.btnEls.menu.addEventListener('click', () => {
      toggleClass(this.fileListWapper, 'show')
    })
  }

  /**
   * 识别检测拖拽到网页的音频文件
   * */
  listenDragAndRecognize() {
    window.addEventListener('dragenter', stopPropagation)

    window.addEventListener('dragover', stopPropagation)

    window.addEventListener('dragleave', stopPropagation)

    window.addEventListener('drop', e => {
      stopPropagation(e)
      this.addAudio(e.dataTransfer.files[0])
    })
  }

  /**
   * 监听通过 + 按钮添加的音频文件
   * */
  listenAddAudio() {
    this.addFileEl.addEventListener('change', e => {
      this.addAudio(e.target.files[0])
    })
  }

  /**
   * 监听进度条的拖动事件(拖动到某个位置播放)，以及 audio 标签的加载事件
   * */
  listenProcessBar() {
    DragMove.bind(this.processBarEl.times, e => {
      const left = Math.min(this.maxLeft, Math.max(0, this.prevLeft + e.deltaX))
      if (this.audioEl.duration) {
        this.processBarEl.bar.setAttribute('style', `width: ${left}px`)
        this.processBarEl.times.setAttribute('style', `left: ${left}px`)
        this.updateTime((this.audioEl.duration * left) / this.maxLeft)
      }
      if (e.type === 'dragMoveEnd') {
        this.prevLeft = left
        if (!this.audioEl.played) this.play()
      }
    })

    this.audioEl.addEventListener('loadedmetadata', () => {
      this.updateTime(0)
    })
  }

  /**
   * 添加音频
   * */
  addAudio(file) {
    if (file && !/\.mp3$/.test(file.name)) {
      alert('只支持 MP3 格式音频！')
    } else if (file) {
      const name = file.name ? file.name : '未知音频'
      if (this.files.some(it => it.name === name)) {
        alert('音频已存在')
      } else {
        blobToBase64(file).then(url => {
          const $file = { name, avatar: getAvatar(), url }
          this.filesChange([...this.files, $file])
          this.currFileChange($file)
        })
      }
    }
  }

  /**
   * 播放
   * */
  play() {
    if (!this.files.length) return alert('播放列表空空如也，请先添加您的音乐！')
    if (!this.currFile) {
      this.currFileChange(this.files[0])
    }
    const isSame = this.audioEl.src === this.currFile.url
    const currTime = this.audioEl.currentTime
    if (!isSame) this.audioEl.src = this.currFile.url
    else this.audioEl.currentTime = currTime
    this.audioEl.play()
    addClass(this.animationEl, 'rotate')
    addClass(this.btnEls.playPause, 'playing')

    clearInterval(this.playTimer)
    this.playTimer = setInterval(() => {
      this.updateTime(undefined, true)
      if (this.audioEl.ended) {
        this.currFileChange(this.getFileByStep(1))
        this.play()
      }
    }, 1000)
  }

  /**
   * 暂停
   * */
  pause() {
    clearInterval(this.playTimer)
    this.audioEl.pause()
    removeClass(this.animationEl, 'rotate')
    removeClass(this.btnEls.playPause, 'playing')
  }

  /**
   * 删除选中的音频
   * */
  del(name) {
    this.filesChange(this.files.filter(it => it.name !== name))
  }

  updateTime(time = undefined, updateBarPosition = false) {
    if (time !== undefined) {
      this.audioEl.currentTime = time
    }

    if (updateBarPosition) {
      this.prevLeft = this.audioEl.duration
        ? (this.maxLeft * this.audioEl.currentTime) / this.audioEl.duration
        : 0
      this.processBarEl.bar.setAttribute('style', `width: ${this.prevLeft}px`)
      this.processBarEl.times.setAttribute('style', `left: ${this.prevLeft}px`)
    }

    this.processBarEl.times.innerText = `${formatTime(
      this.audioEl.currentTime,
    )}/${formatTime(this.audioEl.duration)}`
  }

  /**
   * 获取相对于当前选中文件距离为 step 的文件
   * */
  getFileByStep(step) {
    const index = Math.max(
      0,
      this.currFile
        ? this.files.findIndex(it => it.name === this.currFile.name)
        : 0,
    )
    const len = this.files.length
    const $index = (((index + step) % len) + len) % len
    return this.files[$index]
  }

  /**
   * 当播放列表发生改变时所要做的事情
   * */
  filesChange(files) {
    this.files = files
    const result = this.files.reduce(
      (pre, file) => {
        const res = this.renderFileItem(file)
        pre.innerHtml += res.innerHtml
        pre.effects.push(res.effect)
        return pre
      },
      { innerHtml: '', effects: [] },
    )
    this.fileListEl.innerHTML = result.innerHtml

    result.effects.forEach(cb => cb())
  }

  /**
   * 选中音频文件之后要做的事情
   * */
  currFileChange(file) {
    this.currFile = file
    this.avatarEls.forEach(el => {
      el.src = this.currFile
        ? this.currFile.avatar
        : '/examples/imgs/avatars/sample.jpeg'
    })
    this.filenameEl.innerText = this.currFile ? this.currFile.name : '~音频~'
    const url = this.currFile ? this.currFile.url : ''
    if (this.audioEl.src !== url) this.audioEl.src = url

    if (!file) this.updateTime(0, true)
  }

  /**
   * 渲染播放列表的单个音频文件
   * */
  renderFileItem(file) {
    const itemId = `item-${file.name}`
    const delId = `del-${file.name}`
    const innerHtml = `
        <div class="file-item flex-center" id="${itemId}">
          <h6 class="title">${file.name}</h6>
          <div class="btn-del" id="${delId}">
            <img src="./imgs/del.svg" alt="del">
          </div>
        </div>
    `
    return {
      innerHtml,
      effect: () => {
        document.getElementById(itemId).addEventListener('click', () => {
          this.currFileChange(file)
          this.play()
        })

        document.getElementById(delId).addEventListener('click', e => {
          stopPropagation(e)
          this.del(file.name)
          if (this.currFile.name === file.name) {
            this.pause()
            this.currFileChange(null)
          }
        })
      },
    }
  }
}
