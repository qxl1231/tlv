var tlvspec = require("./tlv-spec.js");
var _ = require('lodash');
var commandHelper = require('./command-helper');

var reportData = new Buffer([0xAA, 0x27, 0xDA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA, 0xB6, 0x01, 0x01, 0xA0, 0x01, 0x01, 0xB0, 0x02, 0x12, 0x34, 0xB1, 0x02, 0x12, 0x34, 0xB5, 0x03, 0x05, 0x95, 0x1, 0xB4, 0x07, 0x31, 0x67, 0x2E, 0x4D, 0x69, 0x6D, 0x41, 0x2a], 'hex');
var caData = new Buffer([0xB6, 0x01, 0x01, 0xA0, 0x01, 0x01, 0xB0, 0x02, 0x12, 0x34, 0xB1, 0x02, 0x12, 0x34, 0xB5, 0x03, 0x05, 0x95, 0x1, 0xB4, 0x07, 0x31, 0x67, 0x2E, 0x4D, 0x69, 0x6D, 0x41], 'hex');
console.log(caData.length);
var ca_len = caData.length;
var tlv_obj = {};
var tlvs = [];


var json2hex4tlv = function json2hex4tlv(jsonStringOrObject, commandSpec, deviceType) {

  //var hexCmdBuf = new Buffer(bufferTemplate);
  var head = new Buffer([0xAA, 0xFF, 0xDB, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA]);
  head[2] = deviceType;
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
        if (value == 1) {
          //console.log("test111:" + value);
          console.log('value len:', value);
          tempArray = [commandSpec[prop].type, value, value];
        }
        else if (value.length > 1) {
          console.log('value len:', value.length);
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
  //console.log(ca_len);

  head[1] = ca_len;

  all = Buffer.concat([head, body]);
  console.log('all:', all);
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
      if (type == statusSpec[key].type ) {
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

var command = {
  ca_appointment_wash: 1,
  ca_pay_result: 1,
  ca_balance: 133.3,
  ca_fee_price: 133.3,
  ca_mode_price: '5_4.05',
  ca_pwd: '1g.MimA'
};

var hex = commandHelper.buf2string(json2hex4tlv(command, tlvspec.commandSpec, '0xDB')).toLowerCase();
console.log(hex);
var json= hex2json4tlv(reportData, tlvspec.statusSpec('04CA'));
console.log(json);
