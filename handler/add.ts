import { Handler, RequestBody } from "../main";
import Mongoose from "mongoose";
import { MongoDBDocumentInterface, parser, sendMessage } from "../util";


const handler: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	const chat = msg.chat;
	const model = Mongoose.model(chat.type, ctx.Schema);
	const _filter: MongoDBDocumentInterface = {
		chatId: chat.id
	}
	const option = parser(msg.text, body.edited_message === undefined);
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
		if (!res || !Array.isArray(res)) {
			let _options = [option];
			model.options = _options;
		} else {

		}
	});
	res.json({
		success: true
	});
	next();
}

export default handler