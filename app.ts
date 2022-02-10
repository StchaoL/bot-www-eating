import express from "express";
// import path from "path";
// import logger from "morgan";

import { URL } from "url";
import fs from "fs";
import { setWebhook, WebHookConf } from "./util";
import { CmdRouter } from "./cmdRouter";

// const express = require('express');
// // const path = require('path');
// // const cookieParser = require('cookie-parser');
// const logger = require('morgan');
// const { URL } = require("url");
// const { setWebhook } = require("./util");
// const { cmdRouter } = require("./main");
// // const indexRouter = require('./routes/index');

const app = express();

const TOKEN = process.env.TOKEN || "abcdefghijklmnopqrstuvwxyz";
const DOMAIN = process.env.DOMAIN || "https://example.net";
const tokenEncoded = Buffer.from(TOKEN).toString("base64");
console.log("TOKEN", TOKEN);
console.log("DOMAIN", DOMAIN);
// app.use(logger('dev'));
const cmdRouter = new CmdRouter();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(logger('dev'));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use(`/${tokenEncoded}`, cmdRouter.main);
app.use(`/${tokenEncoded}`, (req, res, next ) => {
    res.json({
        success: true
    });
}); // 统一响应 Telegram 服务器
app.use("/", (req, res, next) => {
	if(req.path.indexOf(tokenEncoded) != -1)
		return;
	res.send("Invalid url.");
	console.warn("Invalid url with token");
	});
// app.use('/users', usersRouter);

try {
	console.log("Token url:", new URL(tokenEncoded, DOMAIN).toString());
} catch(e) {
	console.error("Error while format token url", e);
	process.exit(2);
}

const webHookOption:WebHookConf = {
	url: new URL(tokenEncoded, DOMAIN).toString()
};

if(process.env.HTTPS_ENABLE) {
	webHookOption.certificate = fs.createReadStream(process.env.CERTIFICATE);
}

setWebhook(webHookOption);

module.exports = app;
