import { Handler, RequestBody } from "../main";
import { MongoDBDocumentInterface, sendMessage, MongoDBModelInterface } from "../util";
import Mongoose from "mongoose"

const handler: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	if (!msg)
		return console.error("Message is undefined:", body);
	const chat = msg.chat;
	const model = Mongoose.model<MongoDBModelInterface>(chat.type, ctx.Schema);
	const _filter: MongoDBDocumentInterface = {
		chatId: chat.id
	}
	model.findOne(_filter).exec((err, res) => {
		if (err) {
			sendMessage({
				chat_id: chat.id,
				text: "有点问题. 它出错了" // i18n
			});
			console.error("start: model.findOne(_filter): err:", err);
			console.error("start: model.findOne(_filter): filter:", _filter);
			return;
		}
		if (!res || !Array.isArray(res.options)) {
			sendMessage({
				chat_id: chat.id,
				text: "木有候选项, 先添加一些候选项吧. " + "/touch" // i18n
			});
		} else {
			let _str = "";
			let _prioritySum = 0;
			let _options = res.options;
			for (let i = 0, len = _options.length; i < len; i++) {
				_prioritySum += _options[i].priority;
			}
			let _candidateIndex = Math.ceil(Math.random() * _prioritySum);
			_prioritySum = 0;
			for (let i = 0, len = _options.length; i < len; i++)
				if ((_prioritySum += _options[i].priority) >= _candidateIndex) {
					_str = _options[i].name;
					break;
				}
			sendMessage({
				chat_id: chat.id,
				parse_mode: "Markdown",
				text: `**${_str}**, 安排! ` // i18n
			});
		}
	});
	res.json({
		success: true
	});
	next();
}

export default handler
