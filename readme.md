## Installing

Install the mdserve server via npm.

```shell
npm install mdserve2 -g
```

## Usage

Change to the directory of your CLI

```shell
cd path/to/serve/from
```

Start the HTTP markdown server in the current directory on port 8080

```shell
mdserve
```

Click on the address link such as http://localhost:8080 to open the browser

![screenshot](https://github.com/pgroot/mdserve/raw/master/screenshot.png)


## Options

```shell
mdserve --help
```

## More example

```shell
mdserve -d /path/to/dir --exclude someDirName -S forExpressStaticDir
```