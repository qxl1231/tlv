/**
 * Created by Ivyjohnson on 16/6/23.
 */

function oneValue(val) {
  return val[0];
}
function twoValue(value) {
  //console.log(value);
  return (value[1] * 256 + value[0]) / 100;
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
function convertchar2Ascii(str) {
  var buf = new Buffer(7);
  //console.log(str);

  for (var x = 0; x < str.trim().length; x++) {
    var temp = str.trim().charAt(x);
    buf[x] = temp.charCodeAt();

  }
  console.log(buf);

  return buf;
}

function pwdValue(value) {

  var pwd = convertAscii2char(value);
  console.log(pwd);

  return pwd;
}

function modeValue(value) {


  var mode = value[0];
  //console.log(mode);
  var price = (value[2] * 256 + value[1]) / 100;
  return mode+"_"+price;
}

var statusSpec = function (reportType) {
  if (reportType == '02CA'||reportType=='03CA'||reportType=='04CA') {
    return {
      ca_appointment_wash: {type: 0xB6,  valueCalcFunc: oneValue},//预约开关
      ca_pay_result: {type: 0xA0,  valueCalcFunc: oneValue},//付费结果

      ca_balance: {type: 0xB0,  valueCalcFunc: twoValue},//余额
      ca_fee_price: {type: 0xB1, valueCalcFunc: twoValue},//扣费金额

      ca_pwd: {type: 0xB4,  valueCalcFunc: pwdValue},//密码};
      ca_mode_price: {type: 0xB5,  valueCalcFunc: modeValue}
    }
  }

};
module.exports.statusSpec = statusSpec;

//-----------------------------------------------------------------------------------------//
function valueOne(val) {
  return val;
}

function valueTwo(balance) {
  var array = [];
  var temp = balance * 100;
  var high = Math.floor(temp / 256);
  var low = Math.floor(temp % 256);
  array[0] = low;
  array[1] = high;
  return array;
}

function getvalue(body, i, len) {
  var valuearray = [];

  for (var j = 0; j < len; j++) {
    var a = body[i + 2 + j];
    valuearray.push(a);
  }

  return valuearray;
}

function valuePwd(pwd) {
  var pwdbuff = convertchar2Ascii(pwd);
  return pwdbuff;
}

function valueMode(mode_price) {
  var mode = mode_price.split('_')[0];
  var temp=mode_price.split('_');
  var price = mode_price.split('_')[1];
  //console.log("aaaa:"+temp);
  //console.log(price);
  var array = [];
  var temp = price * 100;
  var high = Math.floor(temp / 256);
  var low = Math.floor(temp % 256);
  array[0] = mode;
  array[1] = low;
  array[2] = high;
  return array;
}


var commandSpec = {
  ca_appointment_wash: {type: 0xB6,  valueCalcFunc: valueOne},//预约开关
  ca_pay_result: {type: 0xA0,  valueCalcFunc: valueOne},//付费结果

  ca_balance: {type: 0xB0,  valueCalcFunc: valueTwo},//余额
  ca_fee_price: {type: 0xB1,  valueCalcFunc: valueTwo},//扣费金额

  ca_pwd: {type: 0xB4,  valueCalcFunc: valuePwd},//密码
  ca_mode_price: {type: 0xB5, valueCalcFunc: valueMode}


};
module.exports.commandSpec = commandSpec;
