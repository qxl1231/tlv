# tlv hex buff to json /json to hex
我自己写的tlv数据转换json工具
```
var reportData = new Buffer([0xAA, 0x27, 0xDA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xCA, 0xB6, 0x01, 0x01, 0xA0, 0x01, 0x01, 0xB0, 0x02, 0x12, 0x34, 0xB1, 0x02, 0x12, 0x34, 0xB5, 0x03, 0x05, 0x95, 0x1, 0xB4, 0x07, 0x31, 0x67, 0x2E, 0x4D, 0x69, 0x6D, 0x41, 0x2a], 'hex');

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


```

tlv decode for node.js

console.log 如下 :

```
all: <Buffer aa 27 db 00 00 00 00 00 00 02 ca b6 01 01 a0 01 01 b0 00 12 34 b1 00 12 34 b5 00 05 95 01 b4 00 31 67 2e 4d 69 6d 41>
aa,27,db,00,00,00,00,00,00,02,ca,b6,01,01,a0,01,01,b0,00,12,34,b1,00,12,34,b5,00,05,95,01,b4,00,31,67,2e,4d,69,6d,41,bd
<Buffer b6 01 01 a0 01 01 b0 02 12 34 b1 02 12 34 b5 03 05 95 01 b4 07 31 67 2e 4d 69 6d 41>
1g.MimA
{ ca_appointment_wash: 1,
  ca_pay_result: 1,
  ca_balance: 133.3,
  ca_fee_price: 133.3,
  ca_mode_price: '5_4.05',
  ca_pwd: '1g.MimA' }
```
