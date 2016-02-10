# gitmonitor-client

## purpose

The purpose of this app is to remind you to push your code before you shut your macbook and go home, it may be that other people depend on it or your harddrive dies on the way home...

## how to install

```
	npm install -g gitmonitor
```

## how to use

1. setup [gitmonitor-server](https://github.com/theotow/gitmonitor-server) and install [gitmonitor-ios](https://github.com/theotow/gitmonitor-ios)
1. set GITMONITOR_SERVER env var in your bashrc file which points to your gitmonitor-server instance, otherwise it will point to dockerhost.dev:3000
2. cd < your git repo you want to monitor >
3. gitmonitor install
4. scan qrcode with your gitmonitor app

## depends on

* [gitmonitor-server](https://github.com/theotow/gitmonitor-server)
* [gitmonitor-ios](https://github.com/theotow/gitmonitor-ios)
* mac osx cronjobs
* nodejs
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
