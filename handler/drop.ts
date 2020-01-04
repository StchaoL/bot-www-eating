import { Handler, RequestBody, CmdRouterInterface } from "../cmdRouter";
import Mongoose, {Schema, Types} from "mongoose";
import { sendMessage } from "../util";
import {
	DBCatalogListDocInterface,
	DBOptionListInterface,
	DBOptionDocInterface,
	catalogCollName,
	catalogListSchema,
	optionCollName,
	optionsListSchema,
} from "../database";

/** 错误码
 * "查询 Catalog 表时发生错误" -1
 * "查询 Catalog 表为空" -2
 * "命令传入的索引越界" -3
 * "插入 Catalog 记录时失败" -4
 * "删除 Options 记录时出错" -5
 * "删除的数量" >0
 */

const parser = (str: string): number => {
	str = str.replace(/.*?(\d+).*?/g, "$1");
	return Number.parseInt(str);
};

const drop: Handler = async (req, res, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message;
	const chatId = msg.chat.id;
	let index = parser(msg.text);
	let catalogId: Types.ObjectId = null;
	let code:number = 1;
	if (isNaN(index)) {
		sendMessage({
			chat_id: chatId,
			text: "我寻思你发的消息的格式应该有点问题, 你不老实啊" // i18n
		});
		return Promise.resolve(code);
	}

	try {
		catalogId = await deleteCatalog(chatId, index, ctx.DB);
	} catch(e) {
		code = e;
	}
	if (catalogId != null || catalogId != undefined) {
		code = await deleteOptions(catalogId, ctx.DB);
	}

	let resMsgText = "";
	let _count = 0;
	if (code > 0) {
		_count = code;
		code = 0;
	}
	switch (code) {
		case 0:
			resMsgText =
				`删除成功, 不要想它呦\n`;
			break;
		case -1:
		case -2:
		case -4:
			resMsgText = "操作数据库时发生了错误, 操作失败";
			break;
		case -3:
			resMsgText = "越界";
			break;
		case -5:
			resMsgText = "删除清单时出错, 但是放心, 最后我还是把它给删除了";
			break;
		default:
			console.error("Unexpected code:", code);
			resMsgText = "未预料的错误";
	}
	if (code >= 0)
		ctx.State.edited = false;
	sendMessage({
		chat_id: chatId,
		text: resMsgText
	});
	return Promise.resolve(code);
};

const deleteOptions = async (
	catalogId: Types.ObjectId,
	database: Mongoose.Connection
): Promise<number> => {
	let ret = 0;
	const optionsModel: Mongoose.Model<DBOptionDocInterface> =
		database.model(optionCollName, optionsListSchema);
	const _filter: DBOptionListInterface = {
		catalogId
	};
	let rmRes:any = undefined;
	await optionsModel.deleteMany(_filter).exec().then(res => {
		rmRes = res;
	}).catch(err => {
		console.error("optionsModel.deleteMany: err:", err);
		ret = -5;
	});
	if (ret >= 0 && ret != undefined)
		ret = rmRes.deletedCount;
	return Promise.resolve(ret);
};

const deleteCatalog = async (
	chatId: number,
	catalogIndex: number,
	database: Mongoose.Connection
): Promise<Types.ObjectId> => {
	let catalogId: Types.ObjectId = null;
	let ret = 0;
	const catalogListModel: Mongoose.Model<DBCatalogListDocInterface> =
		database.model(catalogCollName, catalogListSchema);
	await catalogListModel.findOne({ chatId }).exec().then(async res => {
		if (!res || !Array.isArray(res.catalogList)) {
			ret = -2;
			return;
		}
		if (catalogIndex >= res.catalogList.length) {
			ret = -3;
			return;
		}
		catalogId = res.catalogList.splice(catalogIndex, 1)[0]._id;
		try {
			await res.save();
		} catch(err) {
			console.error("Save: catalogListModel.save(): err", err);
			ret = -4;
		}
	}).catch(err => {
		console.error("drop: catalogListModel.findOne: err:", err);
		console.error("drop: catalogListModel.findOne: filter:", { chatId });
		ret = -1;
	});
	if (ret < 0)
		return Promise.reject(ret);
	return Promise.resolve(catalogId);
};

export default drop;

/*
 * 对外暴露的删除接口
 */
// export const dropCatalog = () => {
//
// };
