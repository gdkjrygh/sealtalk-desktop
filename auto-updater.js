'use strict'

const Electron = require('electron')
const dialog = Electron.dialog
const app = Electron.app
const events = require('events')
const util = require('util')
const path = require('path')
const log4js = require('log4js');
const Config = require('./conf.js')
const Utils = require('./utils')

// States
const IdleState = 'idle'
const CheckingState = 'checking'
const DownloadingState = 'downloading'
const UpdateAvailableState = 'update-available'
const NoUpdateAvailableState = 'no-update-available'
const UnsupportedState = 'unsupported'
const ErrorState = 'error'

const bind = function (fn, me) { return function () { return fn.apply(me, arguments) } }
if(Config.DEBUG){
  log4js.configure({
    appenders: [
      { type: 'console' },
      { type: 'file', filename: path.join(app.getPath('userData'), 'autoUpdater.log'), category: 'autoUpdater' }
    ]
  })
}
let logger = log4js.getLogger('autoUpdater')
let autoUpdater = null

module.exports = (function () {
  function UpdateController(version) {
    this.version = version
    this.onUpdateError = bind(this.onUpdateError, this)
    this.onUpdateNotAvailable = bind(this.onUpdateNotAvailable, this)
    this.state = IdleState
    // this.iconPath = path.resolve(__dirname, './res/app.png')
    if (process.platform === 'win32') {
      this.feedUrl = `${Config.API_URL_WIN}/sealtalk/windows/update` //
    } else if (process.platform === 'darwin') {
      this.feedUrl = `${Config.API_URL_MAC}/misc/latest_update?version=${this.version}&platform=${process.platform}`
    } else { // linux
      this.feedUrl = null
    }
    process.nextTick((function (_this) {
      return function () {
        return _this.setupAutoUpdater()
      }
    })(this))
  }

  util.inherits(UpdateController, events.EventEmitter)

  UpdateController.prototype.setupAutoUpdater = function () {
    autoUpdater = Electron.autoUpdater
    autoUpdater.on('error', (function (_this) {
      return function (event, message) {
        _this.setState(ErrorState)
        if(Config.DEBUG){
          logger.info("Error Downloading Update: " + message)
          return Utils.showMessage('warning', '下载更新时发生了错误。', '更新失败', message)
        }
        return console.error("Error Downloading Update: " + message)

      }
    })(this))
    autoUpdater.setFeedURL(this.feedUrl)
    autoUpdater.on('checking-for-update', (function (_this) {
      return function () {
        return _this.setState(CheckingState)
      }
    })(this))
    autoUpdater.on('update-not-available', (function (_this) {
      return function () {
        return _this.setState(NoUpdateAvailableState)
      }
    })(this))
    autoUpdater.on('update-available', (function (_this) {
      return function () {
        return _this.setState(DownloadingState)
      }
    })(this))
    autoUpdater.on('update-downloaded', (function (_this) {
      return function (event, releaseNotes, releaseVersion, releaseDate, updateUrl) {
        _this.releaseInfo = {
          releaseVersion: releaseVersion,
          releaseNotes: releaseNotes,
          releaseDate: releaseDate,
          updateUrl: updateUrl
        }
        _this.setState(UpdateAvailableState)
        // return _this.emitUpdateAvailableEvent.apply(_this, _this.getWindows())
        if(Config.DEBUG){
          logger.info('releaseNotes:' + releaseNotes + 'releaseDate:' + releaseDate)
        }
        return _this.emitUpdateAvailableEvent()
      }
    })(this))

    autoUpdater.on('state-changed', (function (_this) {
      return function (state) {
        if(Config.DEBUG){
          return logger.info(state)
        } else{
          return state
        }

      }
    })(this))

    if (!/\w{7}/.test(this.version)) {
      this.scheduleUpdateCheck()
    }
    if (process.platform === 'linux') {
      return this.setState(UnsupportedState)
    }
  }

  UpdateController.prototype.emitUpdateAvailableEvent = function () {
    if (this.releaseInfo === null) {
      return
    }
    return this.emit('update-downloaded', this.releaseInfo)
  }

  UpdateController.prototype.setState = function (state) {
    if (this.state === state) {
      return
    }
    this.state = state
    return this.emit('state-changed', this.state)
  }

  UpdateController.prototype.getState = function () {
    return this.state
  }

  UpdateController.prototype.scheduleUpdateCheck = function () {
    let checkForUpdates, sixHours
    checkForUpdates = (function (_this) {
      return function () {
        return _this.check({
          hidePopups: true
        })
      }
    })(this)
    sixHours = 1000 * 60 * 60 * 6
    setInterval(checkForUpdates, sixHours)
    return checkForUpdates()
  }

  UpdateController.prototype.check = function (arg) {
    let hidePopups
    hidePopups = (arg || {}).hidePopups
    if (autoUpdater === null) {
      return
    }

    if (!hidePopups) {
      autoUpdater.once('update-not-available', this.onUpdateNotAvailable)
      autoUpdater.once('error', this.onUpdateError)
    }
    return autoUpdater.checkForUpdates()
  }

  UpdateController.prototype.install = function () {
    return autoUpdater.quitAndInstall()
  }

  UpdateController.prototype.onUpdateNotAvailable = function () {
    autoUpdater.removeListener('error', this.onUpdateError)
    return Utils.showMessage('info', '没有可用的更新', '没有可用的更新', "版本 " + this.version + " 是当前最新版本。")
  }
  // console.log(i18n.__(i18n.__('autoUpdate.onUpdateNotAvailable.Detail'), 'v1.2.3'))

  UpdateController.prototype.onUpdateError = function (event, message) {
    autoUpdater.removeListener('update-not-available', this.onUpdateNotAvailable)
    return Utils.showMessage('warning', '更新时发生了错误。', '更新失败', message)
  }
  return UpdateController
})()
