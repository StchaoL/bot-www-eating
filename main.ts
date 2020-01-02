
import { RequestHandler, Request, Response, NextFunction } from "express";
import { Update } from "./TelegramType";
import util from "util";
import Mongoose from "mongoose";
// import log4js, { Logger } from 'log4js';

import { mongoInstance, botSchema } from "./util";
import list from "./handler/list";
import add from "./handler/add";
import update from "./handler/update";
import del from './handler/delete';
import start from './handler/start';
import help from './handler/help';

// const logger = log4js.getLogger();

//switch (process.env.NODE_ENV) {
//	case "development":
//		log4js.configure(require("./config/dev/log4js.json"));
//		logger.level = 'debug';
//		break;
//	case "prod":
//		log4js.configure(require("./config/prod/log4js.json"));
//		logger.level = 'warn';
//		break;
//}

interface CmdRouter {
	Command: Array<string>,
	DB: Mongoose.Connection,
	Schema: Mongoose.Schema
}

export interface Handler {
	(req: Request, res: Response, next: NextFunction, context: CmdRouter): any;
}

const BOT_NAME = process.env.BOT_NAME || "www_eating_bot";

const router: { [cmd: string]: Handler } = {
	"start": start,
	"ls": list,
	"rm": del,
	"touch": add,
	"sed": update,
	"help": help
}

export interface RequestBody extends Update { }

const parseCmd = (text: string): Array<string> => {
	let _ret = [];
	text = text.replace(/\s{2,}/g, " ")
	let _split = text.indexOf(" ");
	if(_split <= 0)
		_split = text.length;
	_ret.push(text.slice(0, _split));
	_ret.push(text.slice(_split));
	_ret[0] = _ret[0].replace(/\/(.+)/g, "$1");
	return _ret;
}

export const cmdRouter: RequestHandler = (req, res, next) => {
//	console.log("Request", JSON.stringify(req.body));
	let _body: RequestBody = req.body;
	if (!_body || _body.message == undefined || _body.update_id == undefined) {
		res.json({
			success: false
		});
		console.error(`RequestError: ${util.inspect(_body, true, 5, true)}`);
		next();
		return;
	}
	let _cmdText = _body.message.text;
	if (_cmdText.indexOf(BOT_NAME) >= 0) {
		let _reg = new RegExp("(.+)@" + BOT_NAME + "(.*)", "g");
		_body.message.text = _cmdText.replace(_reg, "$1 $2");
	}
	let cmd: Array<string> = parseCmd(_body.message.text);
	console.log("Command:", _cmdText);
	if (router[cmd[0]] === undefined) {
		res.json({
			success: false
		});
		console.warn(`CommandError: ${util.inspect(_body.message, true, 5, true)}`);
		console.warn("Command parsed: ", JSON.stringify(cmd));
		next();
		return;
	}
	console.log("Command: ", cmd[0]);
	router[cmd[0]](req, res, next, {
		Command: cmd,
		DB: mongoInstance,
		Schema: botSchema
	});
}
