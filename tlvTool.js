/**
 * Created by qxl on 16/6/18. for TLV data encode/decode
 */

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 longshao/qq:278931058
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function buff2json(hexbuff) {
    var json = {};

    var body = hexbuff.slice(11, hexbuff.length - 1);

    console.log(body);
    for (var i = 0; i < body.length;) {
        var type = body[i];
        var len = body[i + 1];
        switch (type) {
            case 0xB6:
                if (len == 1) {
                    var value = body[i + 2];
                    //console.log(value);
                    json.appointment_wash = value;
                }
                break;
            case 0xA0:
                if (len == 1) {
                    var value = body[i + 2];
                    //console.log(value);
                    json.pay_result = value;
                }
                break;
            case 0xB0:
                if (len == 2) {
                    var temp1 = body[i + 2];
                    var temp2 = body[i + 2 + 1];
                    var value = (temp2 * 256 + temp1) / 100;
                    //console.log(value);
                    json.balance = value;
                }
                break;
            case 0xB1:
                if (len == 2) {
                    var temp1 = body[i + 2];
                    var temp2 = body[i + 2 + 1];
                    //转换成多少元
                    var value = (temp2 * 256 + temp1) / 100;
                    //console.log(value);
                    json.fee_price = value;
                }
                break;

            case 0xB4://密码 0xCA  0xB4   0x07   0x31 0x67 0x2E 0x4D 0x69 0x6D 0x41

                if (len == 7) {
                    var array = getvalue(body, i, len);
                    str2 = String.fromCharCode(array[0]);
                    console.log(str2);
                    var pwd = convertAscii2char(array);
                    console.log(pwd);
                    json.pwd = pwd;
                }
                break;

            case 0xB5://洗衣程序价格 0xCA   0xB5    0x03        0x05      0x95      0x1

                if (len == 3) {
                    var array = getvalue(body, i, len);
                    var mode = array[0];
                    //console.log(mode);
                    var value = (array[2] * 256 + array[1]) / 100;
                    json.mode = mode;
                    json.mode_price = value;
                }
                break;

            default :
                console.log("your tlv type is not supported!:" + body[i].toString(16));

        }
        i = i + 2 + len;


    }
    console.log(json);
    return json;

}
//ascii码值||字符串 转换
function convertAscii2char(array) {
    var str = "";
    for (var x = 0; x < array.length; x++) {
        var a = array[x];
        str = str.concat(String.fromCharCode(a));
    }

    return str;
}
//字符串||ascii码值 转换
function convertchar2Ascii(str, B5) {
    var buf = new Buffer(7);
    //console.log(str);

    for (var x = 0; x < str.trim().length; x++) {
        var temp = str.trim().charAt(x);
        buf[x] = temp.charCodeAt();

    }
    console.log(buf);
    B5 = Buffer.concat([B5, buf]);

    return B5;
}

function getvalue(body, i, len) {
    var valuearray = [];
    //var type = body[i];
    //var lenth = body[i + 1];
    //var tlv_json = {};
    for (var j = 0; j < len; j++) {
        var a = body[i + 2 + j];
        valuearray.push(a);
    }
    //tlv_json.type = type;
    //tlv_json.lenth = lenth;
    //tlv_json.value = valuearray;
    return valuearray;
}


function json2buff(json) {
    var head = new Buffer([0xAA, 0x0F, 0xDA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA]);
    var body = {};
    var appointment_wash = json.appointment_wash;
    var pay_result = json.pay_result;
    var balance = json.balance;
    var fee_price = json.fee_price;
    var mode_price = json.mode_price;
    var mode = json.mode;
    var pwd = json.pwd;
    if (appointment_wash) {
        var B6 = new Buffer([0xB6, 0x01, appointment_wash]);
        body = B6;
        //console.log(body);
    }
    if (pay_result) {
        var A0 = new Buffer([0xA0, 0x01, pay_result]);
        body = Buffer.concat([body, A0]);
        //console.log(body);
    }
    if (balance) {
        var temp = balance * 100;
        var high = Math.floor(temp / 256);
        var low = Math.floor(temp % 256);
        //console.log(high);
        //console.log(low);
        var A0 = new Buffer([0xB0, 0x02, low, high]);
        //console.log(A0);
        body = Buffer.concat([body, A0]);
        //console.log(body);
    }
    if (fee_price) {
        var temp = fee_price * 100;
        var high = Math.floor(temp / 256);
        var low = Math.floor(temp % 256);
        var A0 = new Buffer([0xA0, 0x01, low, high]);
        body = Buffer.concat([body, A0]);
        //console.log(body);
    }
    if (mode_price && mode) {
        var temp = mode_price * 100;
        var high = Math.floor(temp / 256);
        var low = Math.floor(temp % 256);
        var B5 = new Buffer([0xB5, 0x03, mode, low, high]);
        body = Buffer.concat([body, B5]);
        //console.log(body);
    }
    if (pwd) {
        var B5 = new Buffer([0xB4, 0x07]);
        B5 = convertchar2Ascii(pwd, B5);
        console.log(B5);


        body = Buffer.concat([body, B5]);
        //console.log(body);
    }


    var all = Buffer.concat([head, body]);
    console.log(all);
    var checkSum = 0;
    for (var i = 2; i < (all.length - 1); i++) {

        checkSum = checkSum + all[i];
    }
    checkSum = ~checkSum;
    checkSum = checkSum + 1;
    checkSum = checkSum & 0xFF;
    //console.log(checkSum);
    var sum = new Buffer([checkSum]);
    var ll = Buffer.concat([all, sum]);
    console.log(ll);
    return ll;

}

var hexbuff = new Buffer([0xAA, 0x0F, 0xDA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA, 0xB6, 0x01, 0x01, 0xA0, 0x01, 0x01, 0xB0, 0x02, 0x12, 0x34, 0xB1, 0x02, 0x12, 0x34, 0xB5, 0x03, 0x05, 0x95, 0x1, 0xB4, 0x07, 0x31, 0x67, 0x2E, 0x4D, 0x69, 0x6D, 0x41, 0x55], 'hex');

var json = buff2json(hexbuff);

json2buff(json);

