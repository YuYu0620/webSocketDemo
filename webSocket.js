const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8666 });
const dayjs = require('dayjs');
// // 在线人数
// let onlineUser = new Set();
// // 消息队列
// let msgList = [];
// 房间列表
let rooms = new Map();
wss.on('connection', (ws) => {
    console.log("webSocket 连接成功");
    ws.on('message', (message) => {
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

        // 前端獲取房間列表
        if (msg.type == 'getRoomList') {
            data = {
                type: 'roomList',
                list: [],
            }
            // if (key.clients.has(ws)) {
            // 根据房间里是否有该用户判断返不返回房间 ， 后期用数据   用户：[房间1 ， 房间2， 房间5] 这样去做筛选
            // }
            rooms.forEach((key, value) => {
                let parse = {
                    roomName: key.roomName,
                    roomId: key.roomId,
                    date: key.date,
                    allMessages: key.allMessages
                }
                data.list.push(parse);
            });
            ws.send(JSON.stringify(data));
        }

        // 新增房间
        if (msg.type == "addRoom") {
            rooms.set(msg.roomId, {
                clients: new Set(),
                allMessages: [],
                allUser: new Set(),
                roomName: msg.roomName,
                roomId: msg.roomId,
                date: dayjs().format("HH:mm")
            });
            // rooms.get(msg.roomId).clients.add(ws);
            // rooms.get(msg.roomId).allUser.add(msg.userName);
            data = {
                type: 'roomList',
                list: [],
            }
            rooms.forEach((key, value) => {
                let parse = {
                    roomName: key.roomName,
                    roomId: key.roomId,
                    date: key.date,
                    allMessages: key.allMessages
                }
                data.list.push(parse);
            });
            ws.send(JSON.stringify(data));
        }

        if (msg.type == 'cut') {
            console.log("cut ======> " , rooms.get(msg.roomId).clients);
            rooms.get(msg.roomId).clients.delete(ws);

            rooms.get(msg.roomId).clients.forEach((item) => {
                data = {
                    type: 'messageList',
                    list: rooms.get(msg.roomId).allMessages,
                    online: rooms.get(msg.roomId).clients.size
                }
                item.send(JSON.stringify(data));
            })
            // userClose(msg.roomId, ws)
        }
        if (msg.type == "getMessageList") {
            const roomData = rooms.get(msg.roomId);
            if (!roomData.clients.has(ws)) {
                roomData.clients.add(ws);
            }
            if (!roomData.allUser.has(msg.userName)) {
                // 添加到房間的用戶裏
                roomData.clients.add(ws);
                roomData.allUser.add(msg.userName);
                // 往消息列表添加一天歡迎數據
                roomData.allMessages.push({
                    userName: msg.userName,
                    content: "",
                    type: "add",
                });
            };
            // 進入房間將未讀清空
            roomData.allMessages.forEach((item) => {
                // 判断发送消息是自己发还是其他人发的
                if (item.type == "self" || item.type == 'others') {
                    console.log("item.userName == msg.userName", item.userName == msg.userName);
                    item.type = item.userName == msg.userName ? "self" : 'others';
                }
            });
            data = {
                type: 'messageList',
                list: roomData.allMessages,
                online: roomData.clients.size
            }
            roomData.clients.forEach((item) => {
                item.send(JSON.stringify(data));
            })
            // onlineUser.forEach((item) => {
            //     data = {
            //         type: item == ws ? "self" : 'others',
            //         userName: msg.userName,
            //         content: msg.content,
            //     };
            //     if (item.readyState === WebSocket.OPEN) {
            //         item.send(JSON.stringify(data));
            //     }
            // });
        }

        if(msg.type == 'sendingMsg'){
            let roomData = rooms.get(msg.roomId);
            roomData.allMessages.push({
                    type :'self',
                    content: msg.content,
                    userName: msg.userName,
            });
            roomData.allMessages.forEach((item) => {
                // 判断发送消息是自己发还是其他人发的
                if (item.type == "self" || item.type == 'others') {
                    item.type = item.userName == msg.userName ? "self" : 'others';
                }
            });
            roomData.clients.forEach((item) => {
                data = {
                    type : item == ws ? "self" : 'others',
                    content: msg.content,
                    userName: msg.userName,
                }
                item.send(JSON.stringify(data))
            })
        }

    });
    ws.on('close', () => {
        console.log('WebSocket 连接已关闭');
    });
});

// 退出
// const userClose = (roomId, ws) => {
//     console.log('WebSocket 连接已关闭');
    
//    
// }