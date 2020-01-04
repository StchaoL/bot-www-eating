import { Handler, RequestBody } from "../cmdRouter";
import Mongoose, { Model } from "mongoose";
import {
	DBCurrentListInterface,
	DBCurrentListDocInterface,
	currentCollName,
	currentListSchema
} from "../database";
import {sendMessage, ParsedOptionInterface, ValidateType, validate} from "../util"
// import update from "./update";

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
	str.replace(/\/[a-z]*\s+(.+?)\s*[:|：]\s*(\d+).*/, (s, g1, g2) => {
			ret.name = g1;
			ret.priority = Number.parseInt(g2);
			return "";
	});
	return ret;
};

const add: Handler = (req, res, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	if (!msg) {
		return console.error("Message is undefined:", body);
	}
	const chat = msg.chat;
	const IModel: Model<DBCurrentListDocInterface> = ctx.DB.model<DBCurrentListDocInterface>(currentCollName, currentListSchema);
	const _filter: DBCurrentListInterface = {
		chatId: chat.id
	};
	//	const option = parser(msg.text, body.edited_message === undefined);
	const option = parser(msg.text);
	if (option.priority < 0 || option.name === "" || isNaN(option.priority)) {
		sendMessage({
			chat_id: chat.id,
			text: "我寻思你发的消息的格式应该有点问题, 你不老实啊" // i18n
		});
		return;
	}
	console.log("Touch options:", JSON.stringify(option));
	option.name = validate(option.name, ValidateType.OptionName);
	option.priority = validate(option.priority, ValidateType.OptionPriority);
	
	IModel.findOne(_filter).exec().then(_res => {
		if (!_res || !Array.isArray(_res.options)) {
			let model = new IModel({
				chatId: chat.id,
				options: [{
					name: option.name,
					priority: option.priority
				}]
			});
			model.save();
			ctx.State.edited = true;
		// } else if (body.edited_message === undefined) {
		} else {
			_res.options.push({
				name: option.name,
				priority: option.priority
			});
			_res.save();
			ctx.State.edited = true;
		}
			//		} else {
		//			return update(req, res, next, ctx);
			//		}
	}).catch(err => {
		sendMessage({
				chat_id: chat.id,
				text: "有点问题. 它出错了" // i18n
			});
		console.error("start: model.findOne(_filter): err:", err);
		console.error("start: model.findOne(_filter): filter:", _filter);
	});
};

export default add
