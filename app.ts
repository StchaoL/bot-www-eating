import express from "express";
// import path from "path";
import logger from "morgan";
import { URL } from "url";
import { setWebhook } from "./util";
import { cmdRouter } from "./main";

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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use(`/${tokenEncoded}`, cmdRouter);
// app.use('/users', usersRouter);

setWebhook({
	url: new URL(tokenEncoded, DOMAIN).toString()
});

module.exports = app;
