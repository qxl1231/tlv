/* jslint node : true */
'use strict';
var Logger = require('./logger');
var crypto = require('crypto');
var serialPortHelper = require('./serial-port-helper');
var protocol = require('./protocol/protocol');
var _ = require('lodash');

// 将buffer转成接口所需要的逗号分隔字符串
var buf2string = function (buf) {
    var result = '';
    for (var ii = 0; ii < buf.length; ii++) {
        result += buf.toString('hex', ii, ii + 1).toUpperCase() + ',';
    }
    return result.slice(0, -1);
};
exports.buf2string = buf2string;

// 将接口所提供的逗号分隔字符串转换成buffer
var string2buf = function (str) {
    var newStr = str.replace(/[,\s]/g, '');
    return new Buffer(newStr, 'hex');
};
exports.string2buf = string2buf;

var rawReportType = function (str) {
    if ((string2buf(str).readUInt8(9) === 0x04) && (string2buf(str).readUInt8(10) === 0x04)) {
        return '0404';
    } else if ((string2buf(str).readUInt8(9) === 0x02) && (string2buf(str).readUInt8(10) === 0x02)) {
        return '0202';
    } else if ((string2buf(str).readUInt8(9) === 0x03) && (string2buf(str).readUInt8(10) === 0x03)) {
        return '0303';
    } else if ((string2buf(str).readUInt8(9) === 0x04) && (string2buf(str).readUInt8(10) === 0x05)) {
        return '0405';
    } else if ((string2buf(str).readUInt8(9) === 0x06) && (string2buf(str).readUInt8(10) === 0x06)) {
        return '0606';
    } else if ((string2buf(str).readUInt8(9) === 0x05) && (string2buf(str).readUInt8(10) === 0x02)) {
        return '0502';
    } else {
        return;
    }
};
exports.rawReportType = rawReportType;

var reportType = function (str) {
    if ((string2buf(str).readUInt8(9) === 0x04) && (string2buf(str).readUInt8(10) === 0x04)) {
        return 'default';
    } else if ((string2buf(str).readUInt8(9) === 0x02) && (string2buf(str).readUInt8(10) === 0x02)) {
        return 'default';
    } else if ((string2buf(str).readUInt8(9) === 0x03) && (string2buf(str).readUInt8(10) === 0x03)) {
        return 'default';
    } else if ((string2buf(str).readUInt8(9) === 0x04) && (string2buf(str).readUInt8(10) === 0x05)) {
        return '0405';
    } else if ((string2buf(str).readUInt8(9) === 0x06) && (string2buf(str).readUInt8(10) === 0x06)) {
        return '0606';
    } else if ((string2buf(str).readUInt8(9) === 0x05) && (string2buf(str).readUInt8(10) === 0x02)) {
        return '0502';
    } else if ((string2buf(str).readUInt8(9) === 0x02) && (string2buf(str).readUInt8(10) === 0xCA)) {
        return '02CA';
    } else {
        return;
    }
};
exports.reportType = reportType;

// 将第三方的json格式控制指令转换为二进制协议；
/**
 * !!!重要!!! 目前假定协议字段无超过8bits的。如该假定失效，代码需做相应修改
 * @param {string | object} 第三方的json格式指令，以字符串形式或对象形式传入
 * @param {object} 第三方相应的协议格式定义
 * @returns {Buffer} 转换后的buffer类型
 */
var json2hexCmd = function (jsonStringOrObject, commandSpec) {
    return json2hexCmdUsingBufferTemplate(jsonStringOrObject, commandSpec, protocol.controlBuf);
};
exports.json2hexCmd = json2hexCmd;

function json2hexCmdUsingBufferTemplate(jsonStringOrObject, commandSpec, bufferTemplate) {

    // 生成一个相应长度的全为FF的buffer（长度是否还需要通过设备型号来判断？）
    // 遍历command中的properties
    // 从第三方命令配置文件中，找到该property所对应的协议字段，包括其offset及length（会不会有一个命令property，但是需要对应到多个协议字段的情况？）
    // 根据offset及length信息，将buffer中相应的字段进行设置
    // 返回buffer

    var hexCmdBuf = new Buffer(bufferTemplate);

    var jsonObj = null;
    if (typeof jsonStringOrObject === 'string') {
        jsonObj = JSON.parse(jsonStringOrObject);
    } else {
        jsonObj = JSON.parse(JSON.stringify(jsonStringOrObject));
    }

    //是否有预处理脚本
    if (commandSpec.prepareScripts && commandSpec.prepareScripts.length) {
        for (var i = 0; i < commandSpec.prepareScripts.length; i++) {
            jsonObj = commandSpec.prepareScripts[i](jsonObj);
        }
    }

    for (var prop in jsonObj) {
        if (commandSpec[prop]) {

            if (commandSpec[prop].mapping == true) {
                jsonObj[prop] = commandSpec.cmdMapping(jsonObj, prop);
            }

            if (commandSpec[prop].simpleCalcFunc) {
                jsonObj[prop] = commandSpec[prop].simpleCalcFunc(jsonObj);
            }

            if (commandSpec[prop].valueCalcFunc) {
                jsonObj[prop] = commandSpec[prop].valueCalcFunc(jsonObj[prop]);
            }

            if (jsonObj[prop] < Math.pow(2, commandSpec[prop].bits)) {
                var startByte = Math.floor(commandSpec[prop].offset / 8);
                // var headingBit = commandSpec[prop].offset % 8;
                var endByte = Math.ceil((commandSpec[prop].offset + commandSpec[prop].bits) / 8);
                var byteLength = endByte - startByte; //基于协议字段不超过8bits的假设，byteLength应该取值为1或2
                var tailBit = endByte * 8 - commandSpec[prop].offset - commandSpec[prop].bits;
                var bits = commandSpec[prop].bits; //应该小于8

                var mask = Math.pow(2, bits) - 1; //长度为bits的全1二进制
                mask <<= tailBit; //中间bits全1，其他bits为0

                var oldBytes = hexCmdBuf.readUIntBE(startByte, byteLength) | mask; //得到1个或2个字节，中间bits为全1，其他bits不变

                var paramBytes = (jsonObj[prop] << tailBit) | (~mask); //得到1个或2个字节，中间bits为命令参数值，其他bits为1
                var newBytes = paramBytes & oldBytes;

                hexCmdBuf.writeUIntBE(newBytes, startByte, byteLength);
            }
        }
    }


    return serialPortHelper.cmdMakeup(hexCmdBuf);

};

var queryHexCmd = new Buffer(protocol.queryBuf);
exports.queryHexCmd = queryHexCmd;

var response0x05Cmd = function (jsonStringOrObject, commandSpec) {
    return json2hexCmdUsingBufferTemplate(jsonStringOrObject, commandSpec, protocol.response0x05Buf);
}
exports.response0x05Cmd = response0x05Cmd;


// 将设备回复的状态指令转换为json格式
var hex2jsonStatus = function (hexStatusString, statusSpec) {

    // hexStatusString = 'aa,29,db,00,00,00,00,00,00,04,04,01,06,00,00,05,20,04,03,00,00,01,01,02,3b,00,20,58,01,00,00,00,00,00,00,00,00,00,00,00,00,0a';

    var hexStatusBuf = string2buf(hexStatusString);
    var jsonStatus = {};

    for (var key in statusSpec) {
        if (statusSpec[key].simpleCalcFunc) {
            jsonStatus[key] = statusSpec[key].simpleCalcFunc(hexStatusBuf);
        } else {
            var startByte = Math.floor(statusSpec[key].offset / 8);
            // var headingBit = statusSpec[key].offset % 8;
            var endByte = Math.ceil((statusSpec[key].offset + statusSpec[key].bits) / 8);
            var byteLength = endByte - startByte; //基于协议字段不超过8bits的假设，byteLength应该取值为1或2
            var tailBit = endByte * 8 - statusSpec[key].offset - statusSpec[key].bits;
            var bits = statusSpec[key].bits; //应该小于8

            var mask = Math.pow(2, bits) - 1; //长度为bits的全1二进制
            mask <<= tailBit; //中间bits全1，其他bits为0

            if (hexStatusBuf.length >= startByte + byteLength) {
                var someBytes = hexStatusBuf.readUIntLE(startByte, byteLength) & mask;
                someBytes >>>= tailBit;

                jsonStatus[key] = (statusSpec[key].postScript ? statusSpec[key].postScript(someBytes) : someBytes);
            } else {
                jsonStatus = _.omit(jsonStatus, key);
            }
        }

        if (statusSpec[key].postMapping) {
            jsonStatus[key] = statusSpec.statusMapping(key, jsonStatus[key]);
            if (jsonStatus[key] === null) {
                jsonStatus = _.omit(jsonStatus, key);
            }
        }

    }

    return _.omit(jsonStatus, 'statusMapping');
};
exports.hex2jsonStatus = hex2jsonStatus;

// 签名算法
var requestSign = function (uri, param, appKey) {

    // 对参数名进行字典排序
    var array = [];
    for (var key in param) {
        array.push(key);
    }
    array.sort();

    // 拼接有序的参数名-值串
    var paramArray = [];
    for (var index in array) {
        var keyName = array[index];
        paramArray.push(keyName + '=' + param[keyName]);
    }

    // SHA编码
    var shaSource = uri + paramArray.join("&");
    shaSource += appKey;

    var sha256 = crypto.createHash('sha256').update(shaSource, 'utf-8').digest('hex');

    return sha256;
};
exports.requestSign = requestSign;


var json2hex4tlv = function json2hex4tlv(jsonStringOrObject, commandSpec,deviceType) {

    //var hexCmdBuf = new Buffer(bufferTemplate);
    var head = new Buffer([0xAA, 0xFF, 0xDB, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA]);
    head[2]=deviceType;
    var body = new Buffer(0);
    var all = {};
    var jsonObj = null;
    if (typeof jsonStringOrObject === 'string') {
        jsonObj = JSON.parse(jsonStringOrObject);
    } else {
        jsonObj = JSON.parse(JSON.stringify(jsonStringOrObject));
    }


    for (var prop in jsonObj) {
        if (commandSpec[prop]) {

            if (commandSpec[prop].valueCalcFunc) {
                var value = commandSpec[prop].valueCalcFunc(jsonObj[prop]);
                //console.log("test1:" + value);
                var tempArray = [commandSpec[prop].type, commandSpec[prop].len];
                if (commandSpec[prop].len == 1) {
                    //console.log("test111:" + value);
                    tempArray = [commandSpec[prop].type, commandSpec[prop].len, value];
                }
                if (commandSpec[prop].len > 1) {
                    for (var a = 0; a < value.length; a++) {
                        tempArray.push(value[a]);
                    }
                }
                //console.log("111:" + tempArray)
                var tlv = new Buffer(tempArray);
                //console.log(tlv)
                body = Buffer.concat([body, tlv]);
            }
        }
    }
    var ca_len = head.length + body.length;
    console.log(ca_len);

    head[1] = ca_len;

     all = Buffer.concat([head, body]);
    console.log(all);
    var checkSum = 0;
    for (var i = 1; i < (all.length ); i++) {

        checkSum = checkSum + all[i];
    }
    checkSum = ~checkSum;
    checkSum = checkSum + 1;
    checkSum = checkSum & 0x00FF;

    //Logger.info(checkSum);
    //Logger.info(all);
    //var ll=serialPortHelper.cmdMakeup(all);
    var sum = new Buffer([checkSum]);
    var ll = Buffer.concat([all, sum]);
    //console.log(ll);
    //Logger.info(ll);
    //console.log(ll.length);
    return ll;


};
exports.json2hex4tlv = json2hex4tlv;

var hex2json4tlv = function hex2json4tlv(hexStatusString, statusSpec) {

    var jsonStatus = {};
    var body = hexStatusString.slice(11, hexStatusString.length - 1);
    console.log(body);

    for (var i = 0; i < body.length;) {
        var type = body[i];
        var len = body[i + 1];
        var value = [];

        if (len >= 1) {
            for (var x = 0; x < len; x++) {
                value.push(body[i + 2 + x]);
            }

        }

        for (var key in statusSpec) {
            if (type == statusSpec[key].type && len == statusSpec[key].len) {
                if (statusSpec[key].valueCalcFunc) {
                    //console.log(value);
                    jsonStatus[key] = statusSpec[key].valueCalcFunc(value);
                    //console.log(jsonStatus);
                }
            }
        }
        i = i + 2 + len;
    }


    return jsonStatus;

};
exports.hex2json4tlv = hex2json4tlv;
