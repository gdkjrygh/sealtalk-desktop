'use strict'

const electron = require('electron')
const app = electron.app

module.exports = [
  {
    label: 'SealTalk',
    submenu: [
      {
        label: 'About SealTalk',
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Account Settings...',
        click () {
          app.emit('menu.main.account_settings')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide SealTalk',
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click () {
          app.quit()
        }
      }
    ]
  }, {
    label: 'Edit',
    submenu: [
      {
        label: 'Search User',
        accelerator: 'Command+F',
        click () {
          app.emit('menu.edit.search')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Undo',
        accelerator: 'Command+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'Command+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: 'Command+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: 'Command+A',
        role: 'selectall'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      // {
      //   label: 'Languages',
      //   enabled: false,
      //   submenu: [
      //     {
      //       label: '简体中文',
      //       click () {
      //         app.emit('menu.view.languages', 'zh-CN')
      //       }
      //     },
      //     {
      //       label: 'English',
      //       click () {
      //         app.emit('menu.view.languages', 'en_US')
      //       }
      //     }
      //   ]
      // },
      // {
      //   type: 'separator'
      // },
      {
        label: 'Reload',
        accelerator: 'Command+R',
        click () {
          app.emit('menu.edit.reload')
        }
      }
    ]
  },
  {
    label: 'Window',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'Command+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'Command+W',
        role: 'close'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      }
    ]
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'Homepage',
        click () {
          app.emit('menu.help.homepage')
        }
      }
    ]
  }
]
