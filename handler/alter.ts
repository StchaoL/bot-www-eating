import { Handler, RequestBody } from "../cmdRouter";
import Mongoose, { Model } from "mongoose";
import {ParsedOptionInterface, sendMessage, validate, ValidateType} from "../util";
import {
	CatalogDocInterface,
	DBCatalogListInterface,
	DBCatalogListDocInterface,
	catalogCollName,
	catalogListSchema

} from "../database";

/**
 * 错误码
 * “命令传入的参数不合规”	-1
 * 查询数据库时出错	-2
 * 空列表，那还更新个屁哇	-3
 * 传入的索引越界	-4
 */

interface ParsedCatalogInterface {
	index: number;
	name: string;
	note: string;
}

const parser = (str: string): ParsedCatalogInterface => {
	// (/\d+\s*(=>|->|👉|→)\s*.+?\s*:\s*\d+.*/)
	// let _index = 0
	if (str.indexOf("：") < 0 && str.indexOf(":") < 0)
		str = str + ":  ";
	let ret: ParsedCatalogInterface = {
		index: -1,
		name: "",
		note: ""
	};
	let reg: RegExp;
	str.replace(/(\d+)\s*(=>|->|👉|→)\s*(.+?)\s*[:：]\s*(.*)/, (s, g1, g2, g3, g4) => {
		ret.index = Number.parseInt(g1);
		ret.name = g3;
		ret.note = g4;
		return "";
	});
	return ret;
};

const _handler = async (filter: DBCatalogListInterface, msgText: string, IModel: Model<DBCatalogListDocInterface>): Promise<number> => {
	const option = parser(msgText);
	let _ret = 0;
	if (option.index < 0 || option.name === "" || isNaN(option.index)) {
		sendMessage({
			chat_id: filter.chatId,
			text: "我寻思你发的消息的格式应该有点问题, 你不老实啊" // i18n
		});
		_ret = -1;
		return Promise.resolve(_ret);
	}
	option.name = validate(option.name, ValidateType.CatalogName);
	option.note = validate(option.note, ValidateType.CatalogNote);
	await IModel.findOne(filter).exec().then(res => {
		if (!res || !Array.isArray(res.catalogList)) {
			sendMessage({
				chat_id: filter.chatId,
				text: "木有已保存的清单, 先保存一份清单吧. /save" // i18n
			});
			_ret = -3;
			return;
		}
		if (option.index >= res.catalogList.length) {
			sendMessage({
				chat_id: filter.chatId,
				text: "我寻思你发的消息应该有点问题, 你不老实啊" // i18n
			});
			_ret = -4;
			return;
		}
		res.catalogList[option.index].name = option.name;
		res.catalogList[option.index].note = option.note;
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
	return new Promise((res) => {
		res(_ret);
	});
};

const alter: Handler = async (req, res, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	if (!msg) {
		return console.error("Message is undefined:", body);
	}
	const chat = msg.chat;
	const _filter: DBCatalogListInterface = {
		chatId: chat.id
	};
	const IModel: Model<DBCatalogListDocInterface> = ctx.DB.model<DBCatalogListDocInterface>(catalogCollName, catalogListSchema);
	let code = await _handler(_filter, msg.text, IModel);
	if(code >= 0) {
		ctx.State.edited = true;
	}
};

export default alter
