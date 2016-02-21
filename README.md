# gitmonitor-client

[![Build Status](https://travis-ci.org/theotow/gitmonitor-client.svg?branch=master)](https://travis-ci.org/theotow/gitmonitor-client)
## purpose

The purpose of this app is to remind you to push your code before you shut your macbook and go home, it may be that other people depend on it or your harddrive dies on the way home...

PS: currently it just reports if your repo is not committed, if it is pushed is not checked

## how to install

```
	npm install -g gitmonitor
```

## how to use

1. setup [gitmonitor-server](https://github.com/theotow/gitmonitor-server) and install [gitmonitor-ios](https://github.com/theotow/gitmonitor-ios)
2. check section settings
3. cd < your git repo you want to monitor >
4. gitmonitor install
5. scan qrcode with your gitmonitor app
6. add .gitmonitor to your .gitignore file if you want to

## settings

* set the serverurl via ```export GITMONITOR_SERVER=http://myserverurl``` in your bashrc , otherwise it will point to dockerhost.dev:3000

## depends on

* [gitmonitor-server](https://github.com/theotow/gitmonitor-server)
* [gitmonitor-ios](https://github.com/theotow/gitmonitor-ios)
* mac osx cronjobs
* nodejs under /usr/local/bin/
* a valid git-repo to monitor

Tested on Mac OSX 10.10.5 & node 4.2.2

## open todos / further improvements

* [ ] write more tests
* [ ] make update interval flexible / currently 1x minute
* [ ] clean up tests properly on error
* [ ] handle rename of folder
* [ ] display version number in help

## licence

MIT
