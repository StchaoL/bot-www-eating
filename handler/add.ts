import { Handler, RequestBody } from "../main";
import Mongoose, { Model } from "mongoose";
import { MongoDBDocumentInterface, MongoDBModelInterface, parser, sendMessage } from "../util";
// import update from "./update";

const handler: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	if (!msg) {
		res.json({
			success: false
		});
		next();
		return ctx.Logger.error("Message is undefined:", body);
	}
	const chat = msg.chat;
	const IModel: Model<MongoDBModelInterface> = Mongoose.model<MongoDBModelInterface>(chat.type, ctx.Schema);
	const _filter: MongoDBDocumentInterface = {
		chatId: chat.id
	}
	//	const option = parser(msg.text, body.edited_message === undefined);
	const option = parser(msg.text, true);
	if (option.priority < 0 || option.name === "" || isNaN(option.index) || isNaN(option.priority)) {
		sendMessage({
			chat_id: chat.id,
			text: "我寻思你发的消息的格式应该有点问题, 你不老实啊" // i18n
		});
		res.json({
			success: true
		});
		next();
		return;
	}
	console.log("Touch options:", JSON.stringify(option));
	IModel.findOne(_filter).exec((err, _res) => {
		if (err) {
			sendMessage({
				chat_id: chat.id,
				text: "有点问题. 它出错了" // i18n
			});
			ctx.Logger.error("start: model.findOne(_filter): err:", err);
			ctx.Logger.error("start: model.findOne(_filter): filter:", _filter);
		} else if (!_res || !Array.isArray(_res.options)) {
			let model = new IModel({
				chatId: chat.id,
				options: [{
					name: option.name,
					priority: option.priority
				}]
			});
			model.save();
		// } else if (body.edited_message === undefined) {
		} else {
			_res.options.push({
				name: option.name,
				priority: option.priority
			});
			_res.save();
		}
			//		} else {
		//			return update(req, res, next, ctx);
			//		}
	});
	res.json({
		success: true
	});
	next();
}

export default handler
