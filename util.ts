import request, { Options, RequestPromise } from "request-promise-native";
import mongoose, { Document } from "mongoose";
import { URL } from "url";
import { SentMessage } from "./TelegramType";
import { OptionInterface } from "./database";

// const mongoose = require('mongoose')
// const config = require('./config')
// const { URL } = require("url");
// const request = require("request-promise-native")
// const fs = require("fs");

const TOKEN = process.env.TOKEN || "abcdefghijklmnopqrstuvwxyz";

interface WebHookConf {
	url: string;
	// certificate?: string;
	max_connection?: number;
	allowed_updates?: Array<string>;
}

export const setWebhook = (conf: WebHookConf): RequestPromise<any> => {
	new URL(conf.url);
	let _opt: Options = {
		uri: `https://api.telegram.org/bot${TOKEN}/setWebhook`,
		formData: conf,
		// {
		// 	max_connection: conf.max_connection,
		// 	allowed_updates: conf.allowed_updates,
		// 	url: conf.url
		// 	// file: {
		// 	// 	value: fs.createReadStream(conf.certificate),
		// 	// 	options: {
		// 	// 		filename: 'test.jpg',
		// 	// 		contentType: 'image/jpg'
		// 	// 	}
		// 	// }
		// },
		headers: {
			'content-type': 'multipart/form-data' // Is set automatically
		}
	};
	return request(_opt);
};

export const sendMessage = (message: SentMessage): RequestPromise<any> => {
	let _opt: Options = {
		uri: `https://api.telegram.org/bot${TOKEN}/sendMessage`,
		formData: message,
		headers: {
			'content-type': 'multipart/form-data' // Is set automatically
		}
	};
	return request(_opt);
};

export interface ParsedOptionInterface extends OptionInterface {
	index: number;
}

export enum ValidateType {
	CatalogName = 0,
	CatalogNote,
	OptionName,
	OptionPriority
}

export const validate = <T>(val: T, type: ValidateType):T {
	let _ret: T = val;
	switch(type) {
		case ValidateType.CatalogName:
		case ValidateType.OptionName:
			if ((val as unknown as string).length > 30)
				(<string><unknown>_ret) = (<string><unknown>val).substring(0, 30);
				break;
		case ValidateType.CatalogNote:
			if((<string><unknown>val).length > 200)
				(<string><unknown>_ret) = (<string><unknown>val).substring(0, 140);
				break;
		case ValidateType.OptionPriority:
			if((<number><unknown>val) > 65535)
				(<number><unknown>_ret) = 65535;
				break;
	}
	return _ret;
}
