import { Handler, RequestBody } from "../cmdRouter";
import { Model } from "mongoose";
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
 * "更新数据库时发生错误"	-2
 */

const _handler = async (filter: DBCurrentListInterface, msgText: string, IModel: Model<DBCurrentListDocInterface>): Promise<number> => {
	let _ret = 0;
	await IModel.updateMany(filter, {
		$set: {
			catalogId: null,
			options: []
		}
	}, {multi: true, overwrite: true}).then(raw => {
		console.log("currentListModel.update: raw", raw);
	}).catch(err => {
		_ret = -2;
		console.error("currentListModel.update: err:", err);
	})
	return Promise.resolve(_ret);
};

const clear: Handler = async (req, res, ctx) => {
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
		ctx.State.catalogId = null;
		ctx.State.edited = false;
	} else {
		sendMessage({
			chat_id: chat.id,
			text: "它出错了."
		});
	}
	return Promise.resolve(code);
};

export default clear
