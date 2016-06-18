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

        }
        i = i + 2 + len;


    }
    console.log(json);
    return json;

}


function json2buff(json) {
    var head = new Buffer([0xAA, 0x0F, 0xDA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA]);
    var body = {};
    var appointment_wash = json.appointment_wash;
    var pay_result = json.pay_result;
    var balance = json.balance;
    var fee_price = json.fee_price;
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
        var A0 = new Buffer([0xA0, 0x01, low, high]);
        body = Buffer.concat([body, A0]);
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

var hexbuff = new Buffer([0xAA, 0x0F, 0xDA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA, 0xB6, 0x01, 0x01, 0xA0, 0x01, 0x01, 0xB0, 0x02, 0x12, 0x34, 0xB1, 0x02, 0x12, 0x34, 0x55], 'hex');

var json = buff2json(hexbuff);

json2buff(json);

