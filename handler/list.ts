import { Handler, RequestBody } from "../cmdRouter";
import Mongoose from "mongoose";
import {
	DBCurrentListInterface,
	OptionInterface,
	DBCurrentListDocInterface,
	currentCollName,
	currentListSchema
} from "../database";
import { sendMessage } from "../util";


const list: Handler = (req, res, ctx) => {
	const body: RequestBody = req.body;
	// const msg = body.message;
	const chat = body.message.chat;
	const model = ctx.DB.model<DBCurrentListDocInterface>(currentCollName, currentListSchema);
	const _filter: DBCurrentListInterface = {
		chatId: chat.id
	};
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
				text: "木有候选项, 先添加一些候选项吧. " + "/touch" // i18n
			});
		} else {
			let stringBuf: Array<string> = [];
			let i = 0;
			stringBuf.push(" *索引*.	*名称*	....	*权重* \n\n");
			res.options.forEach((e: OptionInterface) => {
				stringBuf.push(` ${i}. 	${e.name}	....	${e.priority} \n`);
				i++;
			});
			sendMessage({
				chat_id: chat.id,
				parse_mode: "Markdown",
				text: stringBuf.join("") // i18n
			});
		}
	});
};

export default list
