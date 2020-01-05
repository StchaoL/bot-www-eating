import { Handler, RequestBody } from "../cmdRouter";
// import Mongoose from "mongoose";
import { sendMessage } from "../util";

const handler: Handler = (req, res, ctx) => {
	const body: RequestBody = req.body;
	// const msg = body.message;
	const chat = body.message.chat;
	let _helpText = `我可以帮你随机选一个吃饭的地方（解救纠结症的你）  /start
	但你要预先设置好候选清单  
\t\t	教你怎么用这些命令：/help  
\t	/ls ：显示候选清单 ，执行后输出结果共三列，分别为 “_索引  名称  权重_”  
\t	/touch ：添加一项候选，命令格式为：touch 名称 \[: 权重\]  _留空则为默认值 1_   
\t	/rm ：删除一项候选，命令格式为：rm 索引    
\t	/sed：修改一条候选，命令格式为：sed 索引 => 名称 \[: 权重\]    
\t	/save: 保存当前候选列表, 命令格式为: save \[名称\] _若传入名称则另存为, 否则直接保存, 若不存在则自动新建_
\t	/show: 显示所有的可用候选清单, 命令格式为: show \[索引\], 若传入索引则会输出此单项的备注, 否则只输出名称
\t	/alter: 修改一个候选列表, 命令格式为: alter 索引 => 名称\[: 备注\], 备注不得超过200字, 且不能有冒号
\t	/cd: 切换一个候选列表, 命令格式为: cd \[索引 | 名称\], 传入数字则识别为索引, 其它为名称. 若当前列表未保存则*不会自动保存*. 
\t	/drop: 删除一个候选列表, 命令格式为: drop 索引
\t	/new: 清空当前清单(不会自动保存), 创建一个新的候选清单
\t	/pwd: 查看当前的清单状态

PS：
\t *所有编辑类命令执行时无回显，除非执行过程中出错*  
\t *伪随机数*  
\t 每个聊天均可单独维护一张“候选清单”
`;

//	var helpText:string = require('querystring').escape(_helpText);
//	console.log(helpText);
	sendMessage({
		chat_id: chat.id,
		parse_mode: "Markdown",
		text: _helpText // i18n
	});
};

export default handler
