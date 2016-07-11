/**
 * Created by Ivyjohnson on 16/6/23.
 */
var tlvspec=require("../configuration/DC/protocol/tlv-spec.js");
var commandHelper = require('../lib/command-helper.js');
var applianceHexStatusResp='aa,0e,da,00,00,00,00,00,00,02,ca,b6,01,01,94';
var x=commandHelper.string2buf(applianceHexStatusResp);
var reportData = new Buffer([0xAA, 0x27, 0xDA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA, 0xB6, 0x01, 0x01, 0xA0, 0x01, 0x01, 0xB0, 0x02, 0x12, 0x34, 0xB1, 0x02, 0x12, 0x34, 0xB5, 0x03, 0x05, 0x95, 0x1, 0xB4, 0x07, 0x31, 0x67, 0x2E, 0x4D, 0x69, 0x6D, 0x41, 0x2a], 'hex');
var applianceJsonStatusResp = commandHelper.hex2json4tlv(x, tlvspec.statusSpec('02CA'));
console.log(applianceJsonStatusResp);


var json={ ca_appointment_wash: 1,
    ca_pay_result: 1,
    ca_balance: 133.3,
    ca_fee_price: 133.3,
    ca_mode_price: '5_4.05',
    ca_pwd: '1g.MimA' };
var command={"ca_appointment_wash":1};
var hexCommandString = commandHelper.buf2string(commandHelper.json2hex4tlv(json, tlvspec.commandSpec)).toLowerCase();
console.log(hexCommandString);
