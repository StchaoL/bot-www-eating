import { Handler, RequestBody } from "../cmdRouter";
import Mongoose from "mongoose";
import {
	DBCatalogListInterface,
	DBCatalogListDocInterface,
	CatalogDocInterface,
	catalogCollName,
	catalogListSchema,
	DBCurrentListDocInterface
} from "../database";
import { sendMessage } from "../util";

const parser = (str: string): Array<string> => {
	str = str.replace(/\s{1,}/g, " ");
	return str.split(" ");
}

const show: Handler = async (req, res, ctx) => {
	const body: RequestBody = req.body;
	// const msg = body.message;
	const message = body.message;
	const chatId = message.chat.id;
	let catalogList: Array<CatalogDocInterface> = [];
	catalogList = await databaseOperation(chatId, ctx.DB);
	if (!catalogList || catalogList.length <= 0) {
		sendMessage({
			chat_id: chatId,
			text: "没有查到记录, 请先保存一份清单 /save"
		});
		return;
	}
	const cmdParam = parser(message.text)[1];
	catalogList = filter(cmdParam, catalogList);
	let strBuffer: Array<string> = [];
	if (!cmdParam) {
		strBuffer.push("*索引\t名称*\n");
		for (let i=0, len = catalogList.length; i < len; i++) {
			strBuffer.push(`${i}\t${catalogList[i].name}`);
		}
	} else {
		catalogList.forEach(ele => {
			strBuffer.push(`清单名称: \t*${ele.name}*\n\n
			备注: ${ele.note}\n\n
			`)
		});
	}
	sendMessage({
		chat_id: chatId,
		parse_mode: "Markdown",
		text: strBuffer.join("\n")
	})
}

const databaseOperation = async (chatId: number, database: Mongoose.Connection): Promise<Array<CatalogDocInterface>> => {
const model= database.model<DBCatalogListDocInterface>(catalogCollName, catalogListSchema);
	let _ret:Promise<Array<CatalogDocInterface>> = null;
	await model.findOne({ chatId }).exec().then((res) => {
		if (!res || !Array.isArray(res.catalogList)) {
			_ret = Promise.reject(-2);
			return;
		} else {
			_ret = new Promise(_res => _res(res.catalogList));
			return;
		}
	}).catch(err => {
		console.error("start: model.findOne(_filter): err:", err);
		console.error("start: model.findOne(_filter): filter:", chatId);
		_ret = Promise.reject(-1);
		return;
	});
	return _ret;
}

const filter = (msgText: string|undefined, catalogList: Array<CatalogDocInterface>): Array<CatalogDocInterface> => {
	let index = Infinity;
	if(!msgText) {
		return catalogList;
	} else if(!isNaN(index = parseInt(msgText))) {
		if (index >= catalogList.length)
			return [];
		else
			return [catalogList[index]];
	} else {
		return catalogList.filter(e =>　e.name == msgText);
	}
};

export default show
