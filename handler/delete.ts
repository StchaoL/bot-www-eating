import { Handler, RequestBody } from "../cmdRouter";
import Mongoose, { Model } from "mongoose";
import { sendMessage } from "../util";
import {
	currentCollName,
	currentListSchema,
	DBCurrentListDocInterface,
	DBCurrentListInterface
} from "../database";

/**
 * 
 * 错误码
 * "命令传入的参数错误"	-1
 * "读取数据库时发生错误"	-2
 * 空列表，那还删除个屁哇	-3
 * 传入的索引越界	-4
 */

const _handler = async (filter: DBCurrentListInterface, msgText: string, IModel: Model<DBCurrentListDocInterface>): Promise<number> => {
	msgText = msgText.replace(/.*?(\d+).*?/g, "$1");
	let index = Number.parseInt(msgText);
	let _ret = 0;
	if (isNaN(index)) {
		sendMessage({
			chat_id: filter.chatId,
			text: "我寻思你发的消息的格式应该有点问题, 你不老实啊" // i18n
		});
		_ret = -1;
		return new Promise(res => res(_ret));
	}
	await IModel.findOne(filter).exec().then(res => {
		if (!res || !Array.isArray(res.options)) {
			_ret = -3;
			return sendMessage({
				chat_id: filter.chatId,
				text: "木有候选项, 先添加一些候选项吧. " + "/touch" // i18n
			});
		}
		if (index >= res.options.length) {
			_ret = -4;
			return sendMessage({
				chat_id: filter.chatId,
				text: "我寻思你发的消息应该有点问题, 你不老实啊" // i18n
			});
		}
		res.options.splice(index, 1);
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
	return new Promise(res => res(_ret));
};

const del: Handler = async (req, res, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	// if (!msg) {
	// 	console.error("Message is undefined:", body);
	// 	return Promise.reject();
	// }
	const chat = msg.chat;
	const _filter: DBCurrentListInterface = {
		chatId: chat.id
	};
	const IModel: Model<DBCurrentListDocInterface> = ctx.DB.model<DBCurrentListDocInterface>(currentCollName, currentListSchema);
	const code = await _handler(_filter, msg.text, IModel);
	if (code >= 0) {
		ctx.State.edited = true;
	}
	return Promise.resolve(code);
};

export default del
