import { Handler, RequestBody } from "../cmdRouter";
import Mongoose, { Model } from "mongoose";
import {ParsedOptionInterface, sendMessage} from "../util";
import {
	currentCollName, currentListSchema,
	DBCurrentListDocInterface,
	DBCurrentListInterface

} from "../database";

/**
 * 错误码
 * “命令传入的参数不合规”	-1
 * 查询数据库时出错	-2
 * 空列表，那还更新个屁哇	-3
 * 传入的索引越界	-4
 */

const parser = (str: string): ParsedOptionInterface => {
	// (/\d+\s*(=>|->|👉|→)\s*.+?\s*:\s*\d+.*/)
	// let _index = 0
	if (str.indexOf(":") < 0)
		str = str + ": 1";
	let ret: ParsedOptionInterface = {
		index: -1,
		name: "",
		priority: -1
	};
	let reg: RegExp;
	str.replace(/(\d+)\s*(=>|->|👉|→)\s*(.+?)\s*[:：]{0,1}\s*(\d*).*/, (s, g1, g2, g3, g4) => {
		ret.index = Number.parseInt(g1);
		ret.name = g3;
		ret.priority = Number.parseInt(g4);
		return "";
	});
	return ret;
};

const _handler = async (filter: DBCurrentListInterface, msgText: string, IModel: Model<DBCurrentListDocInterface>): Promise<number> => {
	const option = parser(msgText);
	let _ret = 0;
	if (isNaN(option.priority))
		option.priority = 1;
	if (option.index < 0 || option.priority < 0 || option.name === "" || isNaN(option.index)) {
		sendMessage({
			chat_id: filter.chatId,
			text: "我寻思你发的消息的格式应该有点问题, 你不老实啊" // i18n
		});
		_ret = -1;
		return new Promise((res, rej) => {
			res(_ret);
		});
	}
	await IModel.findOne(filter).exec().then(res => {
		if (!res || !Array.isArray(res.options)) {
			sendMessage({
				chat_id: filter.chatId,
				text: "木有候选项, 先添加一些候选项吧. " + "/touch" // i18n
			});
			_ret = -3;
			return;
		}
		if (option.index >= res.options.length) {
			sendMessage({
				chat_id: filter.chatId,
				text: "我寻思你发的消息应该有点问题, 你不老实啊" // i18n
			});
			_ret = -4;
			return;
		}
		res.options[option.index] = {
			name: option.name,
			priority: option.priority
		};
		res.save();
	}).catch(err => {
		sendMessage({
			chat_id: filter.chatId,
			text: "有点问题. 它出错了" // i18n
		});
		console.error("start: model.findOne(_filter): err:", err);
		console.error("start: model.findOne(_filter): filter:", filter);
		_ret = -2;
	});
	return new Promise((res) => {
		res(_ret);
	});
};

const update: Handler = async (req, res, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	if (!msg) {
		res.json({
			success: false
		});
		return console.error("Message is undefined:", body);
	}
	const chat = msg.chat;
	const _filter: DBCurrentListInterface = {
		chatId: chat.id
	};
	const IModel: Model<DBCurrentListDocInterface> = ctx.DB.model<DBCurrentListDocInterface>(currentCollName, currentListSchema);
	let code = await _handler(_filter, msg.text, IModel);
	if(code >= 0) {
		ctx.State.edited = true;
	}
};

export default update
