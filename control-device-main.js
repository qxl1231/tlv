/* jslint node : true */
'use strict';
var _ = require('lodash');
var apiClient = require('./api-clients');
var app = require('../server');
var commandHelper = require('../lib/command-helper');
var jdSpec = require('./protocol/jd-spec');
var Logger = app.logger;
var moment = require('moment');
var ourSpec = require('./protocol/our-spec');
var proServerConfig = require('../configuration');
var getApplianceInfo = require('./get-appliance-info');
var uuid = require('node-uuid');
var suningSpec = require('./protocol/suning-spec');
var dataReport2opencloud = require('./report-data-to-opencloud');
var tlvspec=require("../configuration/DB/protocol/tlv-spec.js");
function controlAppliance(src, applianceId, order, cb){
  var log = Logger.child({device:applianceId});

  var requestParams = {};
  requestParams.appId = proServerConfig.appId;
  requestParams.stamp = moment().format('YYYYMMDDHHmmss');
  requestParams.applianceId = applianceId;
  requestParams.order = order;
  requestParams.sid = uuid.v1();
  requestParams.sign = commandHelper.requestSign('/v1/pro2base/appliance/control', requestParams, proServerConfig.appKey);

  log.info({requestParams: requestParams}, '设备控制：请求Base服务器');
  //3: 从pro2base/appliance/control接口得到返回值
  apiClient.pro2baseClient.applianceControl.controlAppliance(requestParams,
    function(resp){
      log.info({resp: resp.obj}, 'Base服务器回复');

      // 0202 指令回复不一定准确，不进行处理
      var applianceJsonStatusResp = {};
      var statusOfOurSpec = {};

      var dataToLogstash = {applianceId: applianceId, deviceType: proServerConfig.deviceType};
      if (resp && resp.obj && resp.obj.result && resp.obj.result.reply) {

        var applianceHexStatusResp =resp.obj.result.reply;

        var reportType = commandHelper.reportType(applianceHexStatusResp);
        var rawReportType = commandHelper.rawReportType(applianceHexStatusResp);
        //增加处理02CA,03CA指令的逻辑-03 为查询指令的返回
        if(reportType=='02CA'||reportType=='03CA'){
          var hexbuff=commandHelper.string2buf(applianceHexStatusResp);
          statusOfOurSpec = commandHelper.hex2json4tlv(hexbuff, tlvspec.statusSpec(reportType));

          log.info({applianceHexStatusResp: applianceHexStatusResp,statusOfOurSpec:statusOfOurSpec}, '返回(02CA/03CA)M-Cloud结果结果至weixin等');
          return cb(null, 0, {reply:statusOfOurSpec});
        }else{
          statusOfOurSpec = commandHelper.hex2jsonStatus(applianceHexStatusResp, ourSpec.statusSpec[reportType]);
        }


        _.extend(dataToLogstash, {type: rawReportType});
        _.extend(dataToLogstash, statusOfOurSpec);

        getApplianceInfo(applianceId, function (err, result) {
          //对于京东协议，必须先获取到设备型号
          if (result && result.mInfo.model) {
            if (result) {
              _.extend(dataToLogstash, result);
            }
            app.logstashLogger.log(dataToLogstash);

            if (src == 1) {
              applianceJsonStatusResp = commandHelper.hex2jsonStatus(applianceHexStatusResp, jdSpec.statusSpec(result.mInfo.model, reportType));
              log.info({status: applianceJsonStatusResp}, '返回M-Cloud结果结果至京东');
              if (Object.keys(applianceJsonStatusResp).length) {
                //京东未处理02指令返回，临时workaround，使用report接口进行上报
                dataReport2opencloud(src, applianceId, applianceId, JSON.stringify(applianceJsonStatusResp));

                //正常的02指令返回
                return cb(null, 0, {reply:applianceJsonStatusResp});
              }
            }
          } else {
            log.warn('获取设备信息时发生错误');
          }

        });

        if (src == 1) { //京东，已经处理
          return;
        } else if (src == 2) { //苏宁
          applianceJsonStatusResp = commandHelper.hex2jsonStatus(applianceHexStatusResp, suningSpec.statusSpec[reportType]);
          log.info({status: applianceJsonStatusResp}, '返回M-Cloud结果结果至苏宁');
          return cb(null, 0, {reply:applianceJsonStatusResp});
        } else if (src == 3) {  //阿里
          return cb(null, 0, '');
        // } else if (src == 4) {  //微信
        //   return cb(null, 0, '');
        } else {
          applianceJsonStatusResp = statusOfOurSpec;
          log.info({status: applianceJsonStatusResp}, '返回M-Cloud结果结果至请求方');
          return cb(null, 0, {reply:applianceJsonStatusResp});
        }
      } else if (resp && resp.obj && resp.obj.errorCode) {
        return cb(null, resp.obj.errorCode, resp.obj.msg);
      }
      return cb(null, '3004', 'Unkonw Error'); //shoudn't be here
    },
    function (err) {
      log.warn({error: err}, 'M-Cloud控制失败');
      cb(null, '3004', 'M-Cloud控制失败');
    }
  );
}

module.exports = controlAppliance;
