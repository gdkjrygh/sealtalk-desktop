'use strict';

var gulp = require('gulp');
var myApp = require('electron-connect').server.create({useGlobalElectron: true, port: 30081});
var sequence = require('gulp-sequence');
var clean = require('gulp-clean');
var fs = require('fs-extra');
var argv = require('yargs')
      .option('platform', {
        alias: 'p',
        describe: 'choose a platform',
        choices: ['mac', 'darwin', 'windows','win', 'win32', 'win64'],
        default: 'darwin'
      })
      .argv;
var path = require('path');
var packager = require('electron-packager');
var builder = require('electron-builder');

var packageJSON = require('./package.json');
var CURRENT_ENVIRONMENT = 'development';
var finalAppPaths = [];

gulp.task('serve', function () {
  // Start browser process
  myApp.start();
  //
  // // Restart browser process
  // gulp.watch('app.js', electron.restart);
  //
  // // Reload renderer process
  // gulp.watch(['index.js', 'index.html'], electron.reload);
});

gulp.task('reload:browser', function () {
  // Restart main process
  myApp.restart();
});

//only for test
gulp.task('test', function () {
  // Restart main process
  console.log('test');
  console.log(argv.p);
});

gulp.task('reload:renderer', function () {
  // Reload renderer process
  myApp.reload();
});

gulp.task('default', ['serve']);

gulp.task('cleanup:build', function() {
  var osInfo = getOSInfo();
  var arch = osInfo.arch;
  var platform = osInfo.platform;
  var src = './build/SealTalk-' + platform + '-' + arch;
  return gulp
    .src([src], {
      read: false
    })
    .pipe(clean());
});

gulp.task('env', function(cb) {
  var envInfo = {
    env: CURRENT_ENVIRONMENT
  };
  fs.writeFile('env.json', JSON.stringify(envInfo), cb);
});

gulp.task('production', function(callback) {
  CURRENT_ENVIRONMENT = 'production';
  sequence(
    'cleanup:build',
    // 'linter:src',
    // 'less',
    // 'html',
    'env'
    // 'webpack'
  )(callback);
});

gulp.task('package', function(done) {
  var devDependencies = packageJSON.devDependencies;
  var devDependenciesKeys = Object.keys(devDependencies);
  var ignoreFiles = [
    'build',
    'dist',
    'dist2',
    'tests'
  ];

  devDependenciesKeys.forEach(function(key) {
    ignoreFiles.push('node_modules/' + key);
  });
  var osInfo = getOSInfo();
  var arch = osInfo.arch;
  var platform = osInfo.platform;

  // We will keep all stuffs in dist/ instead of src/ for production
  var iconFolderPath = './res';
  var iconPath;
  var productName = packageJSON.productName;
  productName += '-' + platform + '-' + arch;
  if (platform === 'darwin') {
    iconPath = path.join(iconFolderPath, 'app.icns');
  }
  else {
    iconPath = path.join(iconFolderPath, 'app.ico');
  }

  var ignorePath = ignoreFiles.join('|');
  var ignoreRegexp = new RegExp(ignorePath, 'ig');

  packager({
    'dir': './',
    'name': packageJSON.productName,
    'platform': platform,
    'asar': true,
    // 'asar-unpack': './node_modules/node-notifier/vendor/**',
    // 'asar-unpack-dir': 'node_modules/node-notifier/vendor/',
    'arch': arch,
    'version': '0.36.9',
    'out': './build',
    'icon': iconPath,
    'app-bundle-id': 'SealTalk',   // OS X only
    'app-version': packageJSON.version,
    'build-version': packageJSON.version,
    'helper-bundle-id': 'SealTalk',// OS X only
    'ignore': ignoreRegexp,
    'overwrite': true,
    // 'sign': '',// OS X only
    // 'all': true,
    'version-string': {
      'CompanyName': 'RongCloud',
      'LegalCopyright': 'MIT',
      'FileDescription': packageJSON.description,
      'FileVersion': packageJSON.version,
      'ProductVersion': packageJSON.version,
      'ProductName': packageJSON.productName,
      'InternalName': packageJSON.productName
    }
  }, function(error, appPaths) {
    if (error) {
      console.log(error);
      process.exit(1);
    }
    else {
      // TODO
      // we should support to build all platforms at once later !
      // something like [ 'build/Kaku-darwin-x64' ]
      finalAppPaths = appPaths;
      done();
    }
  });
});

gulp.task('post-package', function(done) {
  var currentLicenseFile = path.join(__dirname, 'LICENSE');

  var promises = finalAppPaths.map(function(appPath) {
    var targetLicenseFile = path.join(appPath, 'LICENSE');
    var promise = new Promise(function(resolve, reject) {
      fs.copy(currentLicenseFile, targetLicenseFile, function(error) {
        if (error) {
          reject(error);
        }
        else {
          resolve();
        }
      });
    });
    return promise;
  });

  Promise.all(promises).then(function() {
    done();
  }).catch(function(error) {
    console.log(error)
    process.exit(1);
  });
});

gulp.task('create-installer', function(done) {

});

gulp.task('build', function(callback) {
  sequence(
    'production',
    'package',
    'post-package'
  )(callback);
});

function getOSInfo(){
  var arch = process.arch || 'ia32';
  var platform = argv.platform || process.platform;
  platform = platform.toLowerCase();
  // platform = argv.p;
  switch (platform) {
    case 'mac':
    case 'darwin':
      platform = 'darwin';
      arch = 'x64';
      break;
    case 'freebsd':
    case 'linux':
      platform = 'linux';
      break;
    case 'linux32':
      platform = 'linux';
      arch = 'ia32';
      break;
    case 'linux64':
      platform = 'linux';
      arch = 'x64';
      break;
    case 'win':
    case 'win32':
    case 'windows':
      platform = 'win32';
      arch = 'ia32';
      break;
    case 'win64':
        platform = 'win32';
        arch = 'x64';
        break;
    default:
      console.log('We don\'t support your platform ' + platform);
      process.exit(1);
      break;
  }
  return {platform:platform, arch:arch};
}
