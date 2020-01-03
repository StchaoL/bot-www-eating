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
 * "已修改, 但查询 Current 表时发生错误" -1
 * "已修改, 但查询 Current 表为空" -2
 * "已修改, 但尝试保存 Current 到 Option 时失败" -3
 * "查询 Catalog 表时发生错误" -4
 * "命令传入的索引值错误" -5
 * "获取 catalogId 后, 查询 Option 表时出错" -6
 * "获取 catalogId 后, 查询 Option 表为空(但这应当是不可能发生的)" -7
 * "写入 Current 时发生错误" -8
 */

const parser = (str: string): number => {
	return parseInt(str.replace(/.*?(\d+).*?/g, "$1"));
};

let catalogSelected: CatalogInterface = null;

export const select: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	// const msg = body.message;
	const chatId = body.message.chat.id;
	const code = databaseOperation(chatId, body.message.text, ctx);
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
			msgText = "查询数据库时发生了错误, 操作失败";
			break;
		case -5:
			msgText = "不存在这个候选列表";
			break;
		case -8:
			msgText = "写入数据库时发生了错误, 操作失败";
			break;
	}
	sendMessage({
		chat_id: chatId,
		parse_mode: "Markdown",
		text: msgText
	});
	next();
};

const databaseOperation = (
	chatId: number,
	msgText: string,
	ctx: CmdRouterInterface
): number => {
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

	// 尝试保存状态
	if (ctx.State && ctx.State.edited) { // 尝试保存未保存的当前列表
		const _filter: DBCurrentListInterface = {
			chatId,
			catalogId: ctx.State.catalogId
		};
		currentListModel.findOne(_filter).exec((err, _res) => {
			if (err) {
				console.error("select: model.findOne(_filter): err:", err);
				console.error("select: model.findOne(_filter): filter:", _filter);
				ret = -1;
			} else if (!_res) {
				console.error("select: model.findOne(_filter): filter:", _filter);
				ret = -2;
			} else {
				unSavedList = _res.options;
				catalogId = _res.catalogId;
			}
			if (ret < 0) {
				return ret;
			}
		});
	}
	// 执行保存
	if (unSavedList.length > 0) { // 执行保存
		optionsModel.update({ catalogId }, {
			catalogId: catalogId,
			options: unSavedList
		}, (err, raw) => {
			if (err) {
				console.error("select: model.findOne(_filter): err:", err);
				ret = -3;
				return ret;
			} else {
				console.log('Edited list has been saved. ', raw);
			}
		})
	}
	// 执行切换
	catalogListModel.findOne({ chatId }).exec((err, _res) => {
		if (err) {
			console.error("select: model.findOne(_filter): err:", err);
			ret = -4;
			return ret;
		} else if (!_res || _res.catalogList.length <= 0) {

		} else {
			catalogList = _res.catalogList;
		}
	});
	let _index = parser(msgText);
	if(isNaN(_index) || _index >= catalogList.length) {
		ret = -5;
		return ret;
	}
	catalogId = catalogList[_index]._id;
	catalogSelected = catalogList[_index];
	optionsModel.findOne({ catalogId }).exec((err, _res) => {
		if (err) {
			console.error("select: optionsModel.findOne: err:", err);
			ret = -6;
		} else if (!_res) {
			ret = -7;
		} else {
			unSavedList = _res.optionList;
		}
		if (ret < 0) {
			return ret;
		}
	});

	currentListModel.update({ chatId }, {
			chatId, catalogId, options: unSavedList
		}, { upsert: true, multi: true, overwrite: true },
		(err, raw) => {
			if (err) {
				ret = -8;
				console.error("currentListModel.update: err:", err);
			} else {
				console.log("currentListModel.update: raw", raw);
			}
	});
	return ret;
};

export default select;

/*
 * 对外暴露的切换接口
 */
// export const loadCatalog = () => {
//
// };
