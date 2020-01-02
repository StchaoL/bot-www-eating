# 解决恰饭纠结症机器人

这是一个 Telegram 机器人，它能够随机地从一个预设的候选清单里选出一项。（主要是用于解决“去哪吃？”问题）

1. 使用了 Express + MongoDB + pm2，因此请提前搭建好 Nodejs 运行环境，装好 `npm` 、 `pm2` 和 `mongodb` 。

  * 安装 Nodejs 和 `npm`

     https://www.cnblogs.com/xingyunfashi/p/9272041.html 

```bash
# 安装 pm2
npm i pm2 -g
# 安装 mongodb
sudo apt install mongodb
```

2. 使用 `npm` 安装依赖库

```bash
npm install
```

3. 在 `env/` 目录下添加适当的环境变量，其中比较重要的是`DOMAIN` 和 `TOKEN`：

|   全局变量    |        含义        |              备注               |
| :-----------: | :----------------: | :-----------------------------: |
|    DOMAIN     |  Webhook 回调域名  |              必填               |
|     TOKEN     |  机器人的 `token`  |              必填               |
|   BOT_NAME    |    机器人的名称    | 选填，主要用于过滤消息中的@信息 |
|     PORT      | Express 监听的端口 |              选填               |
| BUILD_VERSION |   用于构建的版本   | 选填，用于选择 `env/` 下的变量  |

4. 执行编译 (`tsc`)

```bash
npm run build
```

5. 运行机器人

```bash
# 使用 pm2 托管进程
npm run startd

# 直接运行
npm run start
```

可酌情在 `package.json` 里设置运行时加载的环境变量




