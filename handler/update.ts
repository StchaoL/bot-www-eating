import { Handler, RequestBody } from "../main";
import Mongoose, { Model } from "mongoose";
import { MongoDBDocumentInterface, MongoDBModelInterface, parser, sendMessage } from "../util";

const _handler = (filter: MongoDBDocumentInterface, msgText: string, IModel: Model<MongoDBModelInterface>) => {
	const option = parser(msgText, false);
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
}

const handler: Handler = (req, res, next, ctx) => {
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
	const _filter: MongoDBDocumentInterface = {
		chatId: chat.id
	};
	const IModel: Model<MongoDBModelInterface> = Mongoose.model<MongoDBModelInterface>(chat.type, ctx.Schema);
	_handler(_filter, msg.text, IModel);
	res.json({
		success: true
	});
	next();
}

export default handler
