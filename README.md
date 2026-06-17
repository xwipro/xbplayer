# XBPLAYER播放器

# 简介

XbPlayer是基于React开发的网页视频播放组件，支持m3u8,mp4视频播放。组件以简约风格为主。

# 安装

```bash
npm install
```

安装所有的库，之后使用`npm run build`打包。
在dist会生成三个js和一个css。

## xbplayer.css

这是样式文件必须要包含进去的

## xbplayer.iif.js

这个是针对html使用的

## xbplayer.umd.js

这个是针对node使用的

## xbplayer.es.js

这个是针对es6使用的

# 使用

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="xbplayer.css">
    <script src="xbplayer.js"></script>
</head>
<body>
    <script>
        const xbplayer = new XbPlayer();
        xbplayer.src = "视频地址";
    </script>
</body>
</html>
```
