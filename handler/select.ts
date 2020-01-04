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
	CatalogDocInterface,
	CatalogInterface,
	OptionInterface
} from "../database";

/** 错误码
 * "已修改, 但查询 Current 表时发生错误" -1
 * "已修改, 但查询 Current 表为空" -2
 * "已修改, 但尝试保存 Current 到 Option 时失败" -3
 * "查询 Catalog 表时发生错误" -4
 * "查询 CatalogId 表时为空" -9
 * "命令传入的索引值错误" -5
 * "获取 catalogId 后, 查询 Option 表时出错" -6
 * "获取 catalogId 后, 查询 Option 表为空(但这应当是不可能发生的)" -7
 * "写入 Current 时发生错误" -8
 */

const parser = (str: string): string => {
	str = str.replace(/\s{1,}/g, " ");
	return str.split(" ")[1];
};

let catalogSelected: CatalogInterface = null;

const select: Handler = async (req, res, ctx) => {
	const body: RequestBody = req.body;
	// const msg = body.message;
	const chatId = body.message.chat.id;
	const code = await databaseOperation(chatId, body.message.text, ctx);
	let msgText = "";
	switch (code) {
		case 0:
			msgText =
				`切换成功, 当前候选列表名称为 *${catalogSelected.name}*\n
				\t 备注信息: ${catalogSelected.note}\n`;
			break;
		case -1:
		case -2:
		case -3:
			msgText = "尝试保存当前已修改的列表时发生错误, 因此未能执行切换";
			break;
		case -4:
		case -6:
		case -7:
		case -9:
			msgText = "查询数据库时发生了错误, 操作失败";
			break;
		case -5:
			msgText = "不存在这个候选列表";
			break;
		case -8:
			msgText = "写入数据库时发生了错误, 操作失败";
			break;
		default:
			console.error("Unexpected code:", code);
			msgText = "未预料的错误";
	}
	sendMessage({
		chat_id: chatId,
		parse_mode: "Markdown",
		text: msgText
	});
	return Promise.resolve(code);
};

const getCatalogIdByParam = (param: string, catalogList: Array<CatalogDocInterface>): CatalogDocInterface => {
	let _param = parser(param);
	if(!_param) { //空字符串
		return null;
	}
	let _index = parseInt(_param);
	if(!isNaN(_index)) {
		if(_index >= catalogList.length) {
			return null;
		} else {
			return catalogList[_index];
		}
	}
	for(let i=0, len=catalogList.length; i<len; i++) {
		if (catalogList[i].name == _param) {
			return catalogList[i];
		}
	}
	return null;
}

const databaseOperation = async (
	chatId: number,
	msgText: string,
	ctx: CmdRouterInterface
): Promise<number> => {
	let unSavedList: Array<OptionInterface> = [];
	let catalogId: Types.ObjectId;
	let catalogList: Array<CatalogDocInterface> = [];
	let ret = 0;
	const currentListModel: Mongoose.Model<DBCurrentListDocInterface> =
		ctx.DB.model(currentCollName, currentListSchema);
	const optionsModel: Mongoose.Model<DBOptionDocInterface> =
		ctx.DB.model(optionCollName, optionsListSchema);
	const catalogListModel: Mongoose.Model<DBCatalogListDocInterface> =
		ctx.DB.model(catalogCollName, catalogListSchema);

	// 切换时不自动保存
	// 执行切换
	await catalogListModel.findOne({ chatId }).exec().then((_res) => {
		if (!_res || _res.catalogList.length <= 0) {
			ret = -9
		} else {
			catalogList = _res.catalogList;
		}
	}).catch(err => {
		console.error("select: model.findOne(_filter): err:", err);
		ret = -4;
	});
	if (ret < 0)
		return new Promise(res => res(ret));
	
	let _catalogDocSelected = getCatalogIdByParam(msgText, catalogList);
	catalogId = _catalogDocSelected._id;
	catalogSelected = {
		name: _catalogDocSelected.name,
		note: _catalogDocSelected.note
	};
	await optionsModel.findOne({ catalogId }).exec().then((_res) => {
		if (!_res) {
			ret = -7;
		} else {
			unSavedList = _res.optionList;
		}
	}).catch(err => {
		console.error("select: optionsModel.findOne: err:", err);
		ret = -6;
	});
	if (ret < 0)
		return new Promise(res => res(ret));

	await currentListModel.updateMany({ chatId }, {
			$set: {
				chatId,
				catalogId,
				options: unSavedList
			}
		}, { upsert: true }).exec().then((raw) => {
			console.log("currentListModel.update: raw", raw);
	}).catch(err => {
		ret = -8;
		console.error("currentListModel.update: err:", err);
	});
	if (ctx.State) {
		ctx.State.edited = false;
		ctx.State.catalogId = catalogId
	}
	return new Promise(res => res(ret));
};

export default select;

/*
 * 对外暴露的切换接口
 */
// export const loadCatalog = () => {
//
// };

		// 切换时不自动保存
	// // 尝试保存状态
	// if (ctx.State && ctx.State.edited) { // 尝试保存未保存的当前列表
	// 	const _filter: DBCurrentListInterface = {
	// 		chatId,
	// 		catalogId: ctx.State.catalogId
	// 	};
	// 	await currentListModel.findOne(_filter).exec((err, _res) => {
	// 		if (err) {
	// 			console.error("select: model.findOne(_filter): err:", err);
	// 			console.error("select: model.findOne(_filter): filter:", _filter);
	// 			ret = -1;
	// 		} else if (!_res) {
	// 			console.error("select: model.findOne(_filter): filter:", _filter);
	// 			ret = -2;
	// 		} else {
	// 			unSavedList = _res.options;
	// 			catalogId = _res.catalogId;
	// 		}
	// 	});
	// 	if (ret < 0) {
	// 		return new Promise(res => res(ret));
	// 	}
	// }
	// // 执行保存
	// if (unSavedList.length > 0) { // 执行保存
	// 	await optionsModel.update({ catalogId }, {
	// 		catalogId: catalogId,
	// 		options: unSavedList
	// 	}, (err, raw) => {
	// 		if (err) {
	// 			console.error("select: model.findOne(_filter): err:", err);
	// 			ret = -3;
	// 		} else {
	// 			console.log('Edited list has been saved. ', raw);
	// 		}
	// 	})
	// 	if (ret < 0)
	// 		return new Promise(res => res(ret));
	// }