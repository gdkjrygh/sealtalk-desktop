# sealtalk-desktop

## Download Links

We do support Windows, Mac OS X,so please go check it :

http://www.rongcloud.cn/downloads

## Supported Languages

+ 简体中文
+ ... keep adding :)

## Setup Environment

Because we use npm to maintain our third party libraries, you have to make sure before doing anything, these needed stuffs are all installed already.

```
  npm install
  npm start
```
- 特别说明
  electron-prebuilt 1.0.0 以上的版本需要修改 electron-squirrel-startup 模块中 index.js 文件,需要将

  ```
  var app = require('app');
  ```
  改为

  ```
  var app = require('electron').app;
  ```

- 打包

    OS X

    ```
    gulp build -p mac
    ```
    Windows

    ```
    gulp build -p win32 or gulp build -p win64
    ```

- 制作安装包:

    OS X

    ```
    npm run installer:mac
    ```
    Windows

    ```
    npm run installer:win
    ```
- 发布(打包+签名+压缩+安装包):

    OS X

    ```
    npm run release:mac
    ```
    Windows

    ```
    npm run release:win
    ```
