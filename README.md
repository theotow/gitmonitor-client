![logo](https://github.com/theotow/gitmonitor-client/raw/master/github/120x120.png "logo")

# gitmonitor-client

[![wercker status](https://app.wercker.com/status/589b3708b50668263151b6b163d981bc/s/master "wercker status")](https://app.wercker.com/project/bykey/589b3708b50668263151b6b163d981bc)

## purpose

The purpose of this app is to remind you to push your code before you shut your macbook and go home, it may be that other people depend on it or your harddrive dies on the way home...

![flow](https://github.com/theotow/gitmonitor-client/raw/master/github/flow.png "flow")


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

## changelog

[see here](https://github.com/theotow/gitmonitor-client/blob/master/CHANGELOG.md)

## open todos

* [ ] write more tests
* [ ] make update interval flexible / currently 1x minute
* [ ] clean up tests properly on error
* [ ] handle rename of folder
* [ ] fix travis problem

## how to contribute

feel free to send me PRs for the open todos, or come up with other suggestions and improvements

## licence

MIT
