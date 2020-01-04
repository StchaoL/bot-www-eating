import { Handler, RequestBody, CmdRouterInterface } from "../cmdRouter";
import Mongoose, {Schema, Types} from "mongoose";
import { sendMessage } from "../util";
import {
	DBCurrentListDocInterface,
	DBCatalogListDocInterface,
	DBOptionDocInterface,
	currentCollName,
	currentListSchema,
	catalogCollName,
	catalogListSchema,
	optionCollName,
	optionsListSchema,
	DBCurrentListInterface,
	CatalogDocInterface,
	CatalogInterface,
	OptionInterface
} from "../database";

/** 错误码
 * "查询 Current 表时发生错误" -1
 * "查询 Current 表为空" -2
 * "尝试保存 Current 到 Option 时失败" -3
 * "查询 Catalog 表时发生错误" -4
 * "新建 Catalog 记录时失败" -5
 * "插入 Catalog 记录时失败" -6
 */

const parser = (str: string): string => {
	str = str.replace(/\s{1,}/g, " ");
	return str.split(" ")[1];
};

const save: Handler = async (req, res, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message;
	const chatId = msg.chat.id;
	let cmdParam = parser(msg.text);
	let catalogId: Types.ObjectId = null;
	let saveAs = false;
	let code:number = 0;

	// 处理命令, 命令决定 Catalog 的名称以及是否新建
	let catalogName = ""
	if (!cmdParam) { //空字符串或者 undefined
		catalogName = new Buffer(Date.now().toString()).toString("base64");
		catalogName = "清单" + catalogName.substring(catalogName.length - 9, 7);
	} else {
		saveAs = true;
		catalogName = cmdParam;
	}

	// 处理状态, 状态决定是否新建
	if (ctx.State && ctx.State.catalogId !== null) {}
	else {
		saveAs = true;
	}

	if(saveAs) {
		try {
			catalogId = await saveCatalog(chatId, catalogName, ctx.DB);
		} catch (e) {
			code = e;
		}
		if(catalogId != null) {
			code = await saveOptions(chatId, catalogId, ctx.DB);
		}
	} else {
		catalogId = ctx.State.catalogId;
		code = await saveOptions(chatId, catalogId, ctx.DB);
		catalogName = "嘿嘿嘿, 我没写这里的逻辑";
	}
	let resMsgText = "";
	switch (code) {
		case 0:
			resMsgText =
				`保存成功, 当前候选列表名称为 *${catalogName}*\n`;
			break;
		case -1:
		case -2:
		case -3:
			resMsgText = "尝试保存当前已修改的列表时发生错误";
			break;
		case -4:
			resMsgText = "查询数据库时发生了错误, 操作失败";
			break;
		case -5:
		case -6:
			resMsgText = "保存列表失败";
			break;
		default:
			console.error("Unexpected code:", code);
			resMsgText = "未预料的错误";
	}
	if (code >= 0)
		ctx.State.edited = false;
	sendMessage({
		chat_id: chatId,
		parse_mode: "Markdown",
		text: resMsgText
	});
	return Promise.resolve(code);
};

const saveOptions = async (
	chatId: number,
	catalogId: Types.ObjectId,
	database: Mongoose.Connection
): Promise<number> => {
	let ret = 0;
	let unSavedList: Array<OptionInterface> = [];
	const currentListModel: Mongoose.Model<DBCurrentListDocInterface> =
		database.model(currentCollName, currentListSchema);
	const optionsModel: Mongoose.Model<DBOptionDocInterface> =
		database.model(optionCollName, optionsListSchema);

	// 尝试保存状态
	const _filter: DBCurrentListInterface = {
		chatId,
		catalogId
	};
	await currentListModel.findOne(_filter).exec().then((_res) => {
		if (!_res) {
			console.error("Save: currentListModel.findOne(_filter): filter:", _filter);
			ret = -2;
		} else {
			unSavedList = _res.options;
		}
	}).catch(err => {
		console.error("Save: currentListModel.findOne(_filter): err:", err);
		console.error("Save: currentListModel.findOne(_filter): filter:", _filter);
		ret = -1;
	});
	if (ret < 0) {
		return Promise.resolve(ret);
	}
	// 执行保存
	// if (unSavedList.length > 0) { // 执行保存, 即使是空列表也保存, 因为已经保存了 Catalog
		await optionsModel.update({ catalogId }, {
			catalogId: catalogId,
			options: unSavedList
		}, {upsert: true}).exec().then((raw) => {
			console.log('Edited list has been saved. ', raw);
		}).catch(err => {
			console.error("Save: optionsModel.update(_filter): err:", err);
			ret = -3;
		});
		if (ret < 0)
			return Promise.resolve(ret);
	// }
	return Promise.resolve(ret);
};

const saveCatalog = async (
	chatId: number,
	catalogName: string,
	database: Mongoose.Connection
): Promise<Types.ObjectId> => {
	let catalogList: Array<CatalogDocInterface> = [];
	let catalogId: Types.ObjectId = null;
	let ret = 0;
	const catalogListModel: Mongoose.Model<DBCatalogListDocInterface> =
		database.model(catalogCollName, catalogListSchema);
	await catalogListModel.findOne({ chatId }).exec().then(async (_res) => {
		if(!_res || !Array.isArray(_res.catalogList)) {
			let iModel = new catalogListModel({
				chatId,
				catalogList: [{
					name: catalogName,
					note: ""
				}]
			});
			try {
				await iModel.save().then(prod => {
					catalogId = prod.catalogList[0]._id;
				});
			} catch(err) {
				console.error("Save: iModel.save(): err", err);
				ret = -5
			}
		} else {
			let _len = _res.catalogList.length;
			_res.catalogList.push(<CatalogDocInterface>{
				name: catalogName,
				note: ""
			});
			try {
				await _res.save().then(prod => {
					catalogId = prod.catalogList[_len]._id;
				});
			} catch(err) {
				console.error("Save: iModel.save(): err", err);
				ret = -6;
			}
		}
	}).catch(err => {
		console.error("Save: optionsModel.update(_filter): err:", err);
		ret = -4;
	});
	if (ret < 0)
		return Promise.reject(ret);

	return Promise.resolve(catalogId);
};

export default save;

/*
 * 对外暴露的保存接口
 */
// export const saveCatalogAndOptions = () => {
//
// };
