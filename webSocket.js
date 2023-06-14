// const ws = require("nodejs-websocket");
// console.log("开始建立连接...")

// // 在线人数
// let onlineUser = [];
// // 消息队列
// let msgList = [];

// let cutIndex = null;
// const socket = ws.createServer(function (conn) {
//     console.log("conn.readyState", conn.readyState, conn.OPEN);
//     conn.on("text", function (str) {
//         console.log("str ========> ", str);
//         let msg = JSON.parse(str);
//         if (msg.type == "heartbeat") {
//             conn.send(JSON.stringify({
//                 type: "heartbeat",
//                 msg: onlineUser.length
//             }));
//             return;
//         }

//         let data = {}
//         if (msg.type == "login") {
//             let idx = onlineUser.findIndex((item) => {
//                 return item.userName == msg.userName;
//             });
//             if (idx == -1) {
//                 msg.webSocket = conn;
//                 onlineUser.push(msg);
//                 onlineUser.forEach((item) => {
//                     data = {
//                         type: 'add',
//                         userName: msg.userName,
//                         content: msg.content,
//                         token: msg.token,
//                     }
//                     item.webSocket.send(JSON.stringify(data));
//                     item.webSocket.send(JSON.stringify({
//                         type: "heartbeat",
//                         msg: onlineUser.length
//                     }));
//                     console.log("msgList ========> ", msgList);
//                 });
//                 msgList.push(data);
//             };
//             msgList.forEach((item) => {
//                 if (item.type == 'self' || item.type == 'others') {
//                     item.type = msg.userName == item.userName ? 'self' : 'others';
//                 }
//             })
//             let queue = {
//                 type: "messageList",
//                 list: msgList
//             }
//             conn.send(JSON.stringify(queue));
//         }

//         if (msg.type == 'cut') {
//             let idx = onlineUser.findIndex((item) => {
//                 return item.userName == msg.userName;
//             });
//             console.log("idx ===========> ", idx);
//             if (idx > -1) {
//                 onlineUser.splice(idx, 1);
//                 onlineUser.forEach((item) => {
//                     data = {
//                         type: 'cut',
//                         userName: msg.userName,
//                         content: msg.content,
//                         token: msg.token,
//                     }
//                     item.webSocket.send(JSON.stringify(data));
//                     item.webSocket.send(JSON.stringify({
//                         type: "heartbeat",
//                         msg: onlineUser.length
//                     }));
//                     console.log("msgList ========> ", msgList);
//                 });
//                 msgList.push(data);
//             }
//         }

//         if (msg.type == "msg") {
//             onlineUser.forEach((item) => {
//                 console.log("item , msg", item.userName, msg.userName);
//                 data = {
//                     type: item.userName == msg.userName ? "self" : 'others',
//                     userName: msg.userName,
//                     content: msg.content,
//                 };
//                 item.webSocket.send(JSON.stringify(data));
//             });
//             msgList.push(data);
//         }
//     })
//     conn.on("close", function (code, reason) {
//         console.log("关闭连接", code, reason);
//         // conn.close();
//     });
//     conn.on("error", function (code, reason) {
//         console.log("异常关闭", code, reason)
//         // conn.error();
//     });
// }).listen(8666)
// console.log("WebSocket建立完毕")

// module.exports = socket;


const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8666 });
// 在线人数
let onlineUser = new Set();
// 消息队列
let msgList = [];
wss.on('connection', (ws) => {
    console.log('WebSocket 连接已建立');
    onlineUser.add(ws);
    ws.on('message', (message) => {
        console.log('收到消息:', message.toString('utf8'));
        // 处理接收到的消息
        let str = message.toString('utf8');
        let msg = JSON.parse(str);

        // 心脏包，与前端保持联系
        if (msg.type == "heartbeat") {
            ws.send(JSON.stringify({
                type: "heartbeat",
            }));
            return;
        }

        let data = {}
        // 登录
        if (msg.type == "login") {
            data = {
                type: 'add',
                userName: msg.userName,
                content: msg.content,
                token: msg.token,
            }
            onlineUser.forEach((item) => {
                if (item != ws && ws.readyState === WebSocket.OPEN) {
                    item.send(JSON.stringify(data));
                    item.send(JSON.stringify({
                        type: "getOnlineUser",
                        msg: onlineUser.size
                    }));
                }
            })
            // let idx = onlineUser.findIndex((item) => {
            //     return item.userName == msg.userName;
            // });
            // if (idx == -1) {
            //     msg.webSocket = ws;
            //     onlineUser.push(msg);
            //     onlineUser.forEach((item) => {
            //         data = {
            //             type: 'add',
            //             userName: msg.userName,
            //             content: msg.content,
            //             token: msg.token,
            //         }
            //         item.webSocket.send(JSON.stringify(data));
            //         item.webSocket.send(JSON.stringify({
            //             type: "getOnlineUser",
            //             msg: onlineUser.length
            //         }));
            //         console.log("msgList ========> ", msgList);
            //     });
            //     msgList.push(data);
            // };
            msgList.push(data);
            msgList.forEach((item) => {
                if (item.type == 'self' || item.type == 'others') {
                    item.type = msg.userName == item.userName ? 'self' : 'others';
                }
            })
            let queue = {
                type: "messageList",
                list: msgList
            }
            ws.send(JSON.stringify(queue));
        }

        // 检查当前在线人数
        if (msg.type == "getOnlineUser") {
            ws.send(JSON.stringify({
                type: "getOnlineUser",
                msg: onlineUser.size
            }));
        }
        if (msg.type == 'cut') {
            onlineUser.delete(ws)
            data = {
                type: 'cut',
                userName: msg.userName,
                content: msg.content,
                token: msg.token,
            }
            onlineUser.forEach((item) => {
                if (item != ws && ws.readyState === WebSocket.OPEN) {
                    item.send(JSON.stringify(data));
                    item.send(JSON.stringify({
                        type: "getOnlineUser",
                        msg: onlineUser.size
                    }));
                }
            })
            msgList.push(data);
        }

        if (msg.type == "msg") {
            onlineUser.forEach((item) => {
                data = {
                    type: item == ws ? "self" : 'others',
                    userName: msg.userName,
                    content: msg.content,
                };
                if (item.readyState === WebSocket.OPEN) {
                    item.send(JSON.stringify(data));
                }
            });
            msgList.push(data);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket 连接已关闭');
    });
});