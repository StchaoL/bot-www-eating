import { Handler, RequestBody } from "../cmdRouter";
import { Model, Types, Connection } from "mongoose";
import {sendMessage, validate, ValidateType} from "../util";
import {
	DBCatalogListInterface,
	DBCatalogListDocInterface,
	catalogCollName,
	catalogListSchema,
	CatalogInterface

} from "../database";

/**
 * 错误码
 * 未保存 (CatalogId = null)	-1
 * 查询数据库时出错	-2
 * 查不到	-3
 */

const databaseOperation = async (chatId: number, catalogId: Types.ObjectId, database: Connection): Promise<CatalogInterface> => {
	const IModel: Model<DBCatalogListDocInterface> = database.model<DBCatalogListDocInterface>(catalogCollName, catalogListSchema);
	let ret: CatalogInterface = null;
	let code = 0;
	await IModel.findOne({
		chatId,
		"catalogList._id": catalogId
	}).exec().then(res => {
		if (!res || !Array.isArray(res.catalogList) || res.catalogList.length <= 0) {
			console.error("pwd: IModel.findOne: filter:", JSON.stringify({chatId, "catalogList.catalogId": catalogId}));
			code = -3;
		} else {
			ret = res.catalogList[0];
		}
	}).catch(err => {
		console.error("pwd: IModel.findOne: err:", err);
		console.error("pwd: IModel.findOne: filter:", JSON.stringify({chatId, "catalogList.catalogId": catalogId}));
		code = -2;
	});
	if(code >= 0)
		return Promise.resolve(ret);
	else 
		return Promise.reject(code);
};

const pwd: Handler = async (req, res, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	const chatId = msg.chat.id;
	if (!ctx.State) {
		sendMessage({
			chat_id: chatId,
			text: "这是一个严重的程序错误, 不说了, 问就是 bug"
		});
		return Promise.reject("Not a valid state in the context");
	}
	if(ctx.State.catalogId == null) {
		sendMessage({
			chat_id: chatId,
			text: "当前清单未保存"
		});
		return Promise.resolve(-1);
	}
	try {
		let catalog = await databaseOperation(chatId, ctx.State.catalogId, ctx.DB);
		let stateStr = "";
		if (ctx.State.edited)
			stateStr = "已编辑, 未保存";
		else
			stateStr = "已保存, 未编辑";
		sendMessage({
			chat_id: chatId,
			parse_mode: "Markdown",
			text: `清单名称: \t*${catalog.name}*\n\n
			状态: ${stateStr} \n
			备注: ${catalog.note}\n\n
			`
		});
	} catch(e) {
		let str = "";
		switch(e) {
			case -2:
				str = "查询数据库时错误"
				break;
			case -3:
				str = "查无此项. 但是本不该这样, 所以这又是一个 bug"
				break;
			default:
				console.error("Unexpected error: err:", e);
				str = "未知的错误";
		}
		sendMessage({
			chat_id: chatId,
			text: str
		});
	}
	return Promise.resolve(0);
};

export default pwd
