import { Handler, RequestBody } from "../main";
import Mongoose from "mongoose";
import { MongoDBDocumentInterface, sendMessage, OptionInterface, MongoDBModelInterface } from "../util";

const handler: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	// const msg = body.message;
	const chat = body.message.chat;
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
		} else if (!res || !Array.isArray(res.options)) {
			sendMessage({
				chat_id: chat.id,
				text: "木有候选项, 先添加一些候选项吧. " + "/add" // i18n
			});
		} else {
			let stringBuf: Array<string> = [];
			res.options.forEach((e: OptionInterface) => {
				stringBuf.push(` * ${e.name} .... ${e.priority} \n`);
			});
			sendMessage({
				chat_id: chat.id,
				parse_mode: "Markdown",
				text: stringBuf.join("") // i18n
			});
		}
	});
	res.json({
		success: true
	});
	next();
}

export default handler