import { Handler, RequestBody } from "../main";
// import Mongoose from "mongoose";
import { sendMessage } from "../util";

const handler: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	// const msg = body.message;
	const chat = body.message.chat;
	let _helpText = `我可以帮你随机选一个吃饭的地方（解救纠结症的你）  /start
	但你要预先设置好候选清单  
	　　教你怎么用这些命令：/help  
	/ls ：显示候选清单 ，执行后输出结果共三列，分别为 “_索引  名称  权重_”  
	/touch ：添加一项候选，命令格式为：touch 名称 [权重]  _留空则为默认值 1_   
	/rm ：删除一项候选，命令格式为：rm 索引    
	/sed：修改一条候选，命令格式为：sed 索引 => 名称: 权重    

PS：
 *所有编辑类命令执行时无回显，除非执行过程中出错*  
 *伪随机数*  
 每个聊天均可单独维护一张“候选清单”
`;

//	var helpText:string = require('querystring').escape(_helpText);
//	console.log(helpText);	
	sendMessage({
		chat_id: chat.id,
		parse_mode: "Markdown",
		text: _helpText // i18n
	});
	res.json({
		success: true
	});
	next();
}

export default handler
