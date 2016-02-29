'use strict'

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const globalShortcut = electron.globalShortcut
const ipcMain = electron.ipcMain
const Menu = electron.Menu
const shell = electron.shell
const Tray = electron.Tray
const dialog = electron.dialog
const path = require('path')
const fs = require('fs')
const jsonfile = require('jsonfile')
const i18n = require("i18n")
// const notifier = require('node-notifier');

i18n.configure({
    locales:['en', 'zh-CN'],
    directory: __dirname + '/locales',
    defaultLocale: 'zh-CN'
});

// Platform flag.
const platform = {
  OSX: process.platform === 'darwin',
  Windows: process.platform === 'win32'
}
// Report crashes to our server.
require('crash-reporter').start()

// A global reference of the window object.
let mainWindow = null
// Force quit flag.
let forceQuit = false
let tray = null
let bounceID = undefined
let blink = null
// Set AppUserModelId for Windows 10.
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
  mainWindow.show()
  // mainWindow.webContents.send('main', 'active')
})

// Ready to create browser window.
app.on('ready', () => {
  // var greeting = i18n.__('Hello')
  // console.log('greeting:' + greeting)
  // console.log(require('os').release())
  // console.log(require('os').type())
  // console.log(require('os').platform())

  // console.log(require('os').hostname())
  const screen = electron.screen
  let workAreaSize = screen.getPrimaryDisplay().workAreaSize
  let savedBounds = loadWindowBounds()
// dialog.showMessageBox({ title: 'title', message: 'message', detail: 'detail', buttons: ["OK", "NO"] }, function (param){
//      console.log('param:' + param);
// })
// dialog.showErrorBox('title', 'content')
  // Create the browser window.
  mainWindow = new BrowserWindow(
    {
      x: savedBounds.x || 0,
      y: savedBounds.y || 0,
      width: savedBounds.width || workAreaSize.width,
      height: savedBounds.height || workAreaSize.height,
      minWidth: 320,
      minHeight: 640,
      titleBarStyle: 'hidden',
      icon: path.join(__dirname, 'res', 'app.png'),
      title: app.getName(),
      'web-preferences': {
        preload: path.join(__dirname, 'js', 'preload.js'),
        nodeIntegration: false,
        // webSecurity: false,
        plugins: true
      }
    })


  // Load the index.html of the app.
  // mainWindow.loadURL('file://' + path.join(__dirname, 'index.html'))

  mainWindow.loadURL('http://web.sealtalk.im/')
  // mainWindow.loadURL('http://10.10.131.56:8181/')

  // Hide window when the window will be closed otherwise quit app.
  mainWindow.on('close', (event) => {
    // Keep nomarl action on exiting full screen mode.

    if (mainWindow.isFullScreen()) {
      return
    }

    if (!forceQuit) {
      event.preventDefault()
      // mainWindow.blurWebView()
      mainWindow.hide()
    }
    if(blink){
       clearInterval(blink)
    }
    // Save window bounds info when closing.
    saveWindowBounds()
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Dereference the window object when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow.removeAllListeners()
    mainWindow = null
  })

  ipcMain.on('unread-message-count-changed', (event, arg) => {
    let number = parseInt(arg, 10)
    let iconFile

    number = isNaN(number) ? 0 : number

    if(platform.OSX){
      iconFile = number ? 'Mac_Remind_icon.png' : 'Mac_icon.png'
    }
    else {
      iconFile = 'Windows_icon.png'
    }

    tray.setImage(path.join(__dirname, 'res', iconFile))

    if (platform.OSX) {
      setBadge(number)
    }
    else if (platform.Windows){
      setTray(number)
    }
  })

  ipcMain.on('notification-click', () => {
    mainWindow.show()
  })

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
         tray.setImage(path.join(__dirname, 'res', 'Mac_icon.png'))
    } else if (platform.Windows){
         setTray(0)
    }

  })

  ipcMain.on('displayBalloon', (event, title, message) => {
    var options = {
        icon: path.join(__dirname, 'res/Windows_icon.png'),
        title: title,
        content: message
    }
    tray.displayBalloon(options)

  })
  const webContents = mainWindow.webContents

  // Open a browser when click external link.
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
  })

  // Register global shortcut
  if (platform.OSX) {
    globalShortcut.register('CTRL+CMD+SHIFT+I', toggleDevTools)
  } else {
    globalShortcut.register('CTRL+ALT+SHIFT+I', toggleDevTools)
    globalShortcut.register('CTRL+F', searchFriend)
    globalShortcut.register('CTRL+R', reload)
  }

  initMenu()
  initTray()
})

// Open account settings panel on account settings menu item selected.
app.on('menu.main.account_settings', () => {
  mainWindow.show()
  // mainWindow.webContents.send('main', 'open_account_settings')
  mainWindow.webContents.send('menu.main.account_settings')

})

// Set language.
// app.on('menu.view.languages', (lang) => {
//   mainWindow.loadURL('https://web.hitalk.im/?lang=' + lang)
// })

// Focus on search input element.
app.on('menu.edit.search', () => {
  // mainWindow.webContents.send('main', 'menu.edit.search')
  mainWindow.webContents.send('menu.edit.search')
})

// Reload page on reload menu item selected.
app.on('menu.edit.reload', () => {
  mainWindow.show()
  mainWindow.webContents.reloadIgnoringCache()
})

// Open homepage on homeplage menu item selected.
app.on('menu.help.homepage', () => {
  shell.openExternal('http://sealtalk.im')
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
     tray.setImage(path.join(__dirname, 'res', iconFile[1]))
     if(blink){
        clearInterval(blink)
     }
     blink = null
  }
}

// Initialize menu.
function initMenu () {
  let menuTemplate

  if (platform.OSX) {
    menuTemplate = require('./js/menu_osx')
    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
  }
  else if (platform.Windows) {
    // menuTemplate = require('./js/menu_win')
  }


}

// Initialize tray icon on Windows.
function initTray () {
  let iconFile = platform.OSX ? 'Mac_icon.png' : 'Windows_icon.png'

  tray = new Tray(path.join(__dirname, 'res', iconFile))
  tray.setToolTip('SealTalk')
  tray.on('click', () => {
    mainWindow.show()
  })

  if (platform.Windows) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open',
        click () {
          mainWindow.show()
        }
      }, {
        type: 'separator'
      }, {
        label: 'Exit',
        click () {
          app.quit()
        }
      }
    ])

    tray.setContextMenu(contextMenu)
  }

  if (platform.OSX) {

  }
}

// Save window bounds info to setting file.
function saveWindowBounds () {
  let bounds = mainWindow.getBounds()

  jsonfile.writeFile(path.join(__dirname, 'settings.json'), bounds)
}

// Load window bounds info from setting file.
function loadWindowBounds () {
  let bounds = jsonfile.readFileSync(path.join(__dirname, 'settings.json'))

  return bounds
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
// TODO: Kicked by other client, alert a notification.
