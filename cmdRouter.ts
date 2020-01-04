
import { RequestHandler, Request, Response, NextFunction } from "express";
import { Update } from "./TelegramType";
import { sendMessage } from "./util";
import Mongoose, {Connection, Types} from "mongoose";
// import log4js, { Logger } from 'log4js';

import {
	Database,
	currentCollName,
	currentListSchema,
	DBCurrentListDocInterface
} from "./database";
import list from "./handler/list";
import add from "./handler/add";
import update from "./handler/update";
import del from './handler/delete';
import start from './handler/start';
import help from './handler/help';
import show from './handler/show';
import alter from './handler/alter';
import select from './handler/select';
import drop from './handler/drop';
import save from './handler/save';
import clear from "./handler/clear";

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

interface currentState {
	chatId: number;
	catalogId: Types.ObjectId;
	edited: boolean;
}

export interface CmdRouterInterface {
	Command: Array<string>,
	DB: Mongoose.Connection,
	State: currentState
}

// interface catalogMap {
// 	[chatId: string]: number
// }

export interface Handler {
	(req: Request, res: Response, context: CmdRouterInterface): any;
}

export interface RequestBody extends Update { }

export class CmdRouter {

	private BOT_NAME = process.env.BOT_NAME || "www_eating_bot";
	private database: Connection = null;
	private router: { [cmd: string]: Handler } = {
		"start": start,
		"ls": list,
		"rm": del,
		"touch": add,
		"sed": update,
		"help": help,
		"show": show,
		"alter": alter,
		"drop": drop,
		"save": save,
		"cd": select,
		"new": clear
	};

	private stateTable: Array<currentState> = [];

	// private catalogMap: catalogMap = { };

	constructor() {
		this.init();
	}

	private async init() {
		if(this.database == null)
			await this.openDatabase();
		if(!this.database)
			return Promise.resolve("Open database failed");
		const model = this.database.model<DBCurrentListDocInterface>(currentCollName, currentListSchema);
		model.find(null,  {
			catalogId: 1,
			chatId: 1
		}).exec((err, res) => {
			if (err) {
				console.error("Error while open database:", err);
				throw err;
			} else if (!res ) {

			} else {
				res.forEach((val, index) => {
					this.stateTable.push({
						chatId: val.chatId,
						catalogId: val.catalogId,
						edited: false
					})
				})
			}
		})
	}

	private async openDatabase() {
		const _db = new Database();
		if (_db.mongoInstance == null)
			this.database = await _db.connectMongoDB();
	}

	private parseCmd = (text: string): Array<string> => {
		let _ret = [];
		// 合并空白字符
		text = text.replace(/\s{2,}/g, " ");
		let _split = text.indexOf(" ");
		if (_split <= 0)
			_split = text.length;
		_ret.push(text.slice(0, _split));
		_ret.push(text.slice(_split));
		_ret[0] = _ret[0].replace(/\/(.+)/g, "$1");
		return _ret;
	};

	public main: RequestHandler = (req, res, next) => {
		//	console.log("Request", JSON.stringify(req.body));
		if(!this.database) {
			next();
			return;
		}
		let _body: RequestBody = req.body;
		if (!_body || _body.message == undefined || _body.update_id == undefined || !_body.message.text) {
			console.error(`RequestError: ${JSON.stringify(req.body)}`);
			next();
			return;
		}
		let _cmdText = _body.message.text;
		if (_cmdText.indexOf(this.BOT_NAME) >= 0) { //去除命令中@自己的部分
			let _reg = new RegExp("(.+)@" + this.BOT_NAME + "(.*)", "g");
			_body.message.text = _cmdText.replace(_reg, "$1 $2");
		}
		let cmd: Array<string> = this.parseCmd(_body.message.text);
		console.log("Command:", _cmdText);
		if (this.router[cmd[0]] === undefined) {
			console.warn(`CommandError: ${JSON.stringify(_body.message)}`);
			console.warn("Command parsed: ", JSON.stringify(cmd));
			next();
			return;
		}
		let _state: currentState = null;
		let _chatId = _body.message.chat.id;
		for(let s in this.stateTable) {
			if (this.stateTable[s].chatId == _chatId) {
				_state = {
					chatId: _chatId,
					catalogId: this.stateTable[s].catalogId,
					edited: false
				};
				break;
			}
		}
		if (_state === null) { //在当前聊天环境下没有候选, 提示加载或自动加载
			_state = {
				chatId: _chatId,
				catalogId: null,
				edited: true
			};
			this.stateTable.push(_state)
		}
		console.log("Command: ", cmd[0]);
		this.router[cmd[0]](req, res, {
			Command: cmd,
			DB: this.database,
			State: _state
		});
		next();
	}
}
