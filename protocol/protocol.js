/* jslint node : true */
'use strict';

var controlBuf = new Buffer([
	0xAA,      //header
	0x1E,      //len
	0xDA,      //appliance type
	0x00,      //frame check
	0x00,      //reserve
	0x00,      //reserve
	0x00,		   //message identification
	0x00,      //frame ver
	0x00,      //protocol ver
	0x02,	     //message type
	0x02,      //message type 2
	0xFF,      //s:byte(12),--power on
	0xFF,      //s:byte(13),--start pause
	0xFF,      //s:byte(14),
	0xFF,      //s:byte(15),--cycle
	0xFF,      //s:byte(16),
	0xFF,      //s:byte(17),
	0x00,      //s:byte(18),--baby lock, etc
	0xFF,      //s:byte(19),
	0xFF,      //s:byte(20),
	0xFF,      //s:byte(21),
	0xFF,      //s:byte(22),
	0xFF,      //s:byte(23),
	0xFF,      //s:byte(24),
	0xFF,      //s:byte(25),
	0xFF,      //s:byte(26),
	0xFF,      //s:byte(27),
	0xFF,      //s:byte(29),
	0xFF,      //s:byte(29),
	0xFF,      //s:byte(30), data end
	0x00       //checkSum af
]);
exports.controlBuf = controlBuf;

var queryBuf = new Buffer([
	0xAA,      //header
	0x0B,      //len
	0xDA,      //appliance type
	0xD1,      //frame check
	0x00,      //reserve
	0x00,      //reserve
	0x00,		   //message identification
	0x00,      //frame ver
	0x00,      //protocol ver
	0x03,	     //message type
	0x03,      //message type 2
	0x44,      //checkSum af
]);
exports.queryBuf = queryBuf;

var response0x05Buf = new Buffer([
	0xAA,      //header
	0x0B,      //len
	0xDA,      //appliance type
	0xD0,      //frame check
	0x00,      //reserve
	0x00,      //reserve
	0x00,		   //message identification
	0x00,      //frame ver
	0x00,      //protocol ver
	0x05,	     //message type
	0x02,      //message type 2
  0xFF,      //水质的低8位TDS值
  0xFF,      //水质的高8位TDS值
  0xFF,      //当前温度	带符号，一个byte -128~127
  0xFF,      //当天最低温度	带符号，一个byte -128~128
  0xFF,      //当天最高温度	带符号，一个byte -128~129
	0x44,      //checkSum af
]);
exports.response0x05Buf = response0x05Buf;
