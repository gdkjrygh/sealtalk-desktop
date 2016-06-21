var ipcRenderer = require('electron').ipcRenderer
var remote = require('electron').remote
const path = require('path')
// Platform flag.
const platform = {
  OSX: process.platform === 'darwin',
  Windows: process.platform === 'win32'
}
var appInfo

try {
  appInfo = remote.require('./package.json')
} catch (err) {
  appInfo = null
}

window.Electron = {
  ipcRenderer: ipcRenderer,
  appInfo: appInfo,
  updateBadgeNumber: function (number) {
    // console.log('updateBadgeNumber')
    this.ipcRenderer.send('unread-message-count-changed', number)
  },
  kickedOff: function () {
    // Notification里处理win7的提示
    // this.ipcRenderer.send('kicked-off')
    // var options = {
    //     title: "Basic Notification",
    //     body: "测试lalwindows baloon"
    //
    // }
    // new Notification(options.title, options)
  },
  webQuit: function () {
    //修改图标
    // console.log('webQuit')
    this.ipcRenderer.send('webQuit')
  },
  screenShot: function () {
    //修改图标
    this.ipcRenderer.send('screenShot')
  },
  displayBalloon: function (title, message){
    if (platform.Windows){
       this.ipcRenderer.send('displayBalloon', title, message)
    }
  },
  logRequest: function (){
    this.ipcRenderer.send('logRequest')
  }
}
window.Electron.ipcRenderer.on('logOutput', (event, msg) => {
  console.log('logOutput:', msg)

})

window.Electron.ipcRenderer.on('menu.edit.search', () => {
  // console.log('menu.edit.search')
  var input = document.querySelector('div#search-friend input')
  if (input) {
    input.focus()
  }
})

window.Electron.ipcRenderer.on('menu.main.account_settings', () => {
  // console.log('menu.main.account_settings')
  if (typeof(eval('_open_account_settings')) == "function") {
    _open_account_settings()
  }
  else{
    console.log('_open_account_settings do not exist');
  }
})

window.Electron.ipcRenderer.on('screenshot', () => {
  if(typeof(upload_base64) == "undefined"){
    console.log('upload_base64 do not exist');
    return
  }
  if (upload_base64 && typeof(eval(upload_base64)) == "function") {
    upload_base64()
  }
})

/* eslint-disable no-native-reassign, no-undef */
// Extend and replace the native notifications.

function checkWin7(){
   var sUserAgent = navigator.userAgent
   var isWin7 = sUserAgent.indexOf("Windows NT 6.1") > -1 || sUserAgent.indexOf("Windows 7") > -1
   return isWin7
}

const NativeNotification = Notification

Notification = function (title, options) {
  if(platform.OSX){
    delete options.icon
  }
  const notification = new NativeNotification(title, options)
  // 消息提示均由app端调用Notification做,这里只处理win7情况(win7不支持Notification)
  notification.addEventListener('click', () => {
    // console.log('click')
    window.Electron.ipcRenderer.send('notification-click')
  })
  if (platform.Windows){
    if(checkWin7()){
      window.Electron.displayBalloon(title, options.body)
    }
  }
  return notification
}

Notification.prototype = NativeNotification.prototype
Notification.permission = NativeNotification.permission
Notification.requestPermission = NativeNotification.requestPermission.bind(Notification)
/* eslint-enable no-native-reassign, no-undef */
