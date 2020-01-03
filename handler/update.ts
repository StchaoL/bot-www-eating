import { Handler, RequestBody } from "../cmdRouter";
import Mongoose, { Model } from "mongoose";
import {ParsedOptionInterface, sendMessage} from "../util";
import {
	currentCollName, currentListSchema,
	DBCurrentListDocInterface,
	DBCurrentListInterface

} from "../database";

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
	str.replace(/(\d+)\s*(=>|->|👉|→)\s*(.+?)\s*[:|：]\s*(\d+).*/, (s, g1, g2, g3, g4) => {
		ret.index = Number.parseInt(g1);
		ret.name = g3;
		ret.priority = Number.parseInt(g4);
		return "";
	});
	return ret;
};

const _handler = (filter: DBCurrentListInterface, msgText: string, IModel: Model<DBCurrentListDocInterface>) => {
	const option = parser(msgText);
	if (option.index < 0 || option.priority < 0 || option.name === "" || isNaN(option.index) || isNaN(option.priority)) {
		sendMessage({
			chat_id: filter.chatId,
			text: "我寻思你发的消息的格式应该有点问题, 你不老实啊" // i18n
		});
		return;
	}
	IModel.findOne(filter).exec((err, res) => {
		if (err) {
			sendMessage({
				chat_id: filter.chatId,
				text: "有点问题. 它出错了" // i18n
			});
			console.error("start: model.findOne(_filter): err:", err);
			console.error("start: model.findOne(_filter): filter:", filter);
			return;
		}
		if (!res || !Array.isArray(res.options)) {
			return sendMessage({
				chat_id: filter.chatId,
				text: "木有候选项, 先添加一些候选项吧. " + "/touch" // i18n
			});
		}
		if (option.index >= res.options.length)
			return sendMessage({
				chat_id: filter.chatId,
				text: "我寻思你发的消息应该有点问题, 你不老实啊" // i18n
			});
		res.options[option.index] = {
			name: option.name,
			priority: option.priority
		};
		res.save();
	});
};

const update: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	if (!msg) {
		res.json({
			success: false
		});
		next();
		return console.error("Message is undefined:", body);
	}
	const chat = msg.chat;
	const _filter: DBCurrentListInterface = {
		chatId: chat.id
	};
	const IModel: Model<DBCurrentListDocInterface> = ctx.DB.model<DBCurrentListDocInterface>(currentCollName, currentListSchema);
	_handler(_filter, msg.text, IModel);
	next();
};

export default update
