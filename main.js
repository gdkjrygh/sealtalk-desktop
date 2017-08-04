'use strict'
if (require('electron-squirrel-startup')) return

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const globalShortcut = electron.globalShortcut
const ipcMain = electron.ipcMain
const Menu = electron.Menu
const MenuItem = electron.MenuItem
const shell = electron.shell
const Tray = electron.Tray
const dialog = electron.dialog
const clipboard = electron.clipboard
const nativeImage = electron.nativeImage
const path = require('path')
const fs = require('fs')
const jsonfile = require('jsonfile')
const i18n = require("i18n")
const initSize = {width: 1000, height:640}
const json = require('./package.json')
const Config = require('./conf.js')

// Platform flag.
const platform = {
  OSX: process.platform === 'darwin',
  Windows: process.platform === 'win32',
  Linux: process.platform === 'linux'
}

const UpdateController = !platform.Linux ? require('./auto-updater') : null
const Utils = require('./utils')

i18n.configure({
    locales:['en', 'zh-CN'],
    directory: __dirname + '/locales',
    defaultLocale: 'zh-CN',
    objectNotation: true ,
    register: app,
    // syncFiles: true,
    api: {
      '__': 't',
      '__n': 'tn'
    }
});

// A global reference of the window object.
let mainWindow = null
let forceQuit = false
let tray = null
let bounceID = undefined
let blink = null
let updateManager = null
let isManualClose = false
let myScreen = null

electron.crashReporter.start({
  productName: json.productName,
  companyName: json.author,
  submitURL: `${Config.REPORT_URL}/post`,
  autoSubmit: true
})

if (platform.Windows) {
  app.setAppUserModelId('im.sealtalk.SealTalk.SealTalk')
}

process.on('error', function(err) {
  console.log(err);
});

// Set forceQuit flag when quit.
app.on('before-quit', () => {
  forceQuit = true
})

// Show main window when activate app icon.
app.on('activate', () => {
  if (mainWindow) {
     mainWindow.show()
  }
})

// Ready to create browser window.
app.on('ready', () => {

  const screen = electron.screen
  let workAreaSize = screen.getPrimaryDisplay().workAreaSize
  let savedBounds = loadWindowBounds()

  // Create the browser window.
  mainWindow = new BrowserWindow(
    {
      x: savedBounds.x || (workAreaSize.width - initSize.width)/2,
      y: savedBounds.y || (workAreaSize.height - initSize.height),
      width: savedBounds.width || initSize.width,
      height: savedBounds.height || initSize.height,
      minWidth: 320,
      minHeight: 640,
      titleBarStyle: 'hidden',
      icon: path.join(__dirname, 'res', 'app.png'),
      title: app.getName(),
      'webPreferences': {
        preload: path.join(__dirname, 'js', 'preload.js'),
        nodeIntegration: false,
        // webSecurity: false,
        plugins: true
      }
    })

  mainWindow.loadURL(Config.APP_ONLINE)

  // Hide window when the window will be closed otherwise quit app.
  mainWindow.on('close', (event) => {
    if (mainWindow.isFullScreen()) {
      return
    }

    if (!forceQuit) {
      event.preventDefault()
      // mainWindow.blurWebView()
      mainWindow.hide()
    }

    if (forceQuit) {
      if(blink){
         clearInterval(blink)
      }
      // if(platform.Windows && myScreen){
      //   myScreen.exit_shot();
      // }
    }
    // Save window bounds info when closing.
    saveWindowBounds()
  })

  // Dereference the window object when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow.removeAllListeners()
    mainWindow = null
  })

  ipcMain.on('unread-message-count-changed', (event, arg) => {
    let number = parseInt(arg, 10)
    let iconFile
    number = isNaN(number) ? 0 : number

    if (platform.OSX) {
      setBadge(number)
    }
    else if (platform.Windows){
      setTray(number)
    }
  })

  ipcMain.on('logRequest', (event) => {
    event.sender.send('logOutput', 'msg you need log')
  })

  ipcMain.on('notification-click', () => {
    if (mainWindow) {
       mainWindow.show()
    }
  })

  //该方法暂停用
  ipcMain.on('kicked-off', () => {
      console.log('kicked-off')
      if (platform.OSX){
          bounceID = app.dock.bounce('informational')

      } else if (platform.Windows){
        var options = {
            icon: path.join(__dirname, 'res/Windows_icon.png'),
            title: "Basic Notification ad",
            content: "hah adfasfd"
        }
        tray.displayBalloon(options)
          // tray.displayBalloon(path.join(__dirname, 'res/Windows_Remind_icon.png'), 'SealTalk信息提示','您的账号在其他地方登陆!')
      }
  })

  ipcMain.on('webQuit', () => {
    if (platform.OSX){
         setBadge(0)
         tray.setImage(path.join(__dirname, 'res', 'Mac_Template.png'))
    } else if (platform.Windows){
         setTray(0)
    }
  })

  ipcMain.on('screenShot', () => {
      takeScreenshot()
  })

  ipcMain.on('displayBalloon', (event, title, message) => {
    displayBalloon(title, message)
  })

  const webContents = mainWindow.webContents

  webContents.on('new-window', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  // Prevent load a new page when accident.
  webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
  })

  // Injects CSS into the current web page.
  webContents.on('dom-ready', () => {
    webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'res', 'browser.css'), 'utf8'))
    webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'js', 'postload.js'), 'utf8'))

    if (!UpdateController || updateManager) return
    updateManager = new UpdateController(app.getVersion())

    // Show dialog to install
    updateManager.on('update-downloaded', function (releaseInfo) {
      let ret = dialog.showMessageBox(mainWindow, {
        type: 'info',
        buttons: ['取消', '安装并重启'],
        icon: path.join(__dirname, 'res/app.png'),
        message: '发现更新：' + releaseInfo.releaseVersion,
        title: '应用更新',
        detail: releaseInfo.releaseNotes || ''
      })
      if (ret === 1) {
        // isManualClose = true
        forceQuit = true
        updateManager.install()
      }
    })

    updateManager.on('state-changed', function (state) {
      if (platform.Windows) {
        displayBalloon('自动更新中...', state)
      }
   })

  })

  bindGlobalShortcuts()
  initMenu()
  initTray()

  // process.crash()
})

// Open account settings panel on account settings menu item selected.
app.on('menu.main.account_settings', () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.webContents.send('menu.main.account_settings')
  }
})

// Set language.
app.on('menu.view.languages', (lang) => {
  // mainWindow.loadURL('https://web.hitalk.im/?lang=' + lang)
  i18n.setLocale(lang)
  initMenu()
})

// Focus on search input element.
app.on('menu.edit.search', () => {
  // mainWindow.webContents.send('main', 'menu.edit.search')
  mainWindow.webContents.send('menu.edit.search')
})

// Reload page on reload menu item selected.
app.on('menu.edit.reload', () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.webContents.reloadIgnoringCache()
  }
})

// Open homepage on homeplage menu item selected.
app.on('menu.help.homepage', () => {
  shell.openExternal('http://sealtalk.im')
})


app.on('menu.checkUpdate', function () {
  if (!updateManager) return
  if(updateManager.state == "downloading"){
    Utils.showMessage('info', '正在更新', '正在更新', "当前更新状态: 正在下载中")
    return
  }
  if (updateManager.state !== 'idle' && updateManager.state !== 'no-update-available') return
  updateManager.check()
})

app.on('menu.edit.takeScreenshot', function () {
  takeScreenshot()
})

app.on('browser-window-blur', () => {
  globalShortcut.unregisterAll()
})

app.on('browser-window-focus', () => {
  bindGlobalShortcuts()
})

let shouldQuit = app.makeSingleInstance((argv, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window
  if (mainWindow) {
    mainWindow.show()
  }
  return true
})

if (shouldQuit) {
  app.quit()
}

function setBadge (unreadCount) {
  let text

  if (unreadCount < 1) {
    text = ''
  } else if (unreadCount > 99) {
    text = '99+'
  } else {
    text = unreadCount.toString()
  }

  app.dock.setBadge(text)
  tray.setTitle(text == '' ? '' : text)
}

// Set tray icon on Windows.闪烁
function setTray (unreadCount) {
  let iconFile = ['Windows_Remind_icon.png','Windows_icon.png']
  let flag

  if(unreadCount > 0){
    if(!blink){
      blink = setInterval(function(){
        flag = !flag
        tray.setImage(path.join(__dirname, 'res', iconFile[flag ? 1 : 0]))
      },500)
    }
  }
  else{
     if(blink){
        clearInterval(blink)
     }
     blink = null
     tray.setImage(path.join(__dirname, 'res', iconFile[1]))
  }
}

// Initialize menu.
function initMenu () {
  let menuTemplate

  if (platform.OSX) {
    menuTemplate = require('./js/menu_osx')(i18n.getLocale())
    const menu = Menu.buildFromTemplate(menuTemplate)

    Menu.setApplicationMenu(menu)
  }
  else if (platform.Windows) {
    // menuTemplate = require('./js/menu_win')
  }
}

// Initialize tray icon on Windows.
function initTray () {
  let iconFile = platform.OSX ? 'Mac_Template.png' : 'Windows_icon.png'

  tray = new Tray(path.join(__dirname, 'res', iconFile))
  tray.setToolTip('SealTalk')
  tray.on('click', () => {
    if (mainWindow) {
       mainWindow.show()
    }
  })

  if (platform.Windows) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: app.__('winTrayMenus.Open'),
        click () {
          if (mainWindow) {
            mainWindow.show()
          }
        }
      }, {
        label: app.__('winTrayMenus.CheckUpdate'),
        click () {
          app.emit('menu.checkUpdate')
        }
      }, {
        type: 'separator'
      }, {
        label: app.__('winTrayMenus.Exit'),
        click () {
          app.quit()
        }
      }
    ])
    tray.setContextMenu(contextMenu)
  }

  if (platform.OSX) {
     tray.setPressedImage(path.join(__dirname, 'res/Mac_TemplateWhite.png'))
  }
}

// Save window bounds info to setting file.
function saveWindowBounds () {
  let bounds = mainWindow.getBounds()
  jsonfile.writeFile(path.join(app.getPath('userData'), 'settings.json'), bounds)
}

// Load window bounds info from setting file. create an empty file when not exist
function loadWindowBounds () {
  let bounds = null
  let src = path.join(__dirname, 'settings.json')
  let dest = path.join(app.getPath('userData'), 'settings.json')

  try{
    if(fileExists(dest)){
      try{
         bounds = jsonfile.readFileSync(dest)
      }
      catch(err){
        bounds = {"x": 0, "y": 0, "width": 0, "height": 0}
      }
    }
    else{
      // console.log('not exist')
      bounds = {"x": 0, "y": 0, "width": 0, "height": 0}
      fs.closeSync(fs.openSync(dest, 'w'));
    }
  }
  catch (err){
    Utils.showError(err)
  }
  return bounds
}

function fileExists(filePath)
{
    try
    {
        return fs.statSync(filePath).isFile()
    }
    catch (err)
    {
        return false
    }
}

function toggleDevTools () {
  mainWindow.toggleDevTools()
}

function searchFriend () {
  app.emit('menu.edit.search')
}

function reload () {
  app.emit('menu.edit.reload')
}

function displayBalloon(title, msg) {
  var options = {
      icon: path.join(__dirname, 'res/app.png'),
      title: title,
      content: msg
  }
  tray.displayBalloon(options)
}

process.on('uncaughtException', function (error) {
  // Utils.handleError(error)
  Utils.showError(error)
})

function takeScreenshot() {
}

 function bindGlobalShortcuts(){
   if (platform.OSX) {
     globalShortcut.register('CTRL+CMD+SHIFT+I', toggleDevTools)
     globalShortcut.register('CTRL+CMD+S', takeScreenshot)
   } else {
     globalShortcut.register('CTRL+ALT+SHIFT+I', toggleDevTools)
     globalShortcut.register('CTRL+F', searchFriend)
     globalShortcut.register('CTRL+R', reload)
     globalShortcut.register('CTRL+ALT+S', takeScreenshot)
   }
 }

// TODO: Kicked by other client, alert a notification.
