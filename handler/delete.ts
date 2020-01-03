import { Handler, RequestBody } from "../cmdRouter";
import Mongoose, { Model } from "mongoose";
import { sendMessage } from "../util";
import {
	currentCollName,
	currentListSchema,
	DBCurrentListDocInterface,
	DBCurrentListInterface
} from "../database";

const _handler = (filter: DBCurrentListInterface, msgText: string, IModel: Model<DBCurrentListDocInterface>) => {
	msgText = msgText.replace(/.*?(\d+).*?/g, "$1");
	let index = Number.parseInt(msgText);
	if (isNaN(index)) {
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
		if (index >= res.options.length)
			return sendMessage({
				chat_id: filter.chatId,
				text: "我寻思你发的消息应该有点问题, 你不老实啊" // i18n
			});
		res.options.splice(index, 1);
		res.save();
	});
};

const del: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	if (!msg) {
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

export default del
