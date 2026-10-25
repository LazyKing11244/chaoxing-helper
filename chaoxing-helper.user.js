// ==UserScript==
// @name         【减负社区】【超星学习通小助手】【完全免费】视频-章节测试|自动挂机|防清进度|不占资源
// @namespace    unrival
// @version      5.0.0
// @homepageURL  https://github.com/LazyKing11244/chaoxing-helper
// @supportURL   https://github.com/LazyKing11244/chaoxing-helper/issues
// @updateURL    https://raw.githubusercontent.com/LazyKing11244/chaoxing-helper/main/chaoxing-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/LazyKing11244/chaoxing-helper/main/chaoxing-helper.user.js
// @description  2026 重构维护版：修复正确率计算与音频汇报 Bug、移除冗余体积与远端裸 IP、支持多题库聚合与 AI 大模型自动答题、含填空题支持。
// @author       unrival
// @run-at       document-end
// @storageName  unrivalxxt
// @match        *://*.chaoxing.com/*
// @match        *://*.edu.cn/*
// @match        *://*.nbdlib.cn/*
// @match        *://*.hnsyu.net/*
// @match        *://*.ac.cn/*
// @icon         http://pan-yz.chaoxing.com/favicon.ico
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_info
// @connect      mooc1-1.chaoxing.com
// @connect      mooc1.chaoxing.com
// @connect      mooc1-2.chaoxing.com
// @connect      passport2-api.chaoxing.com
// @connect      cx.icodef.com
// @connect      api.deepseek.com
// @connect      *
// @license      GPL-3.0-or-later
// @original-script https://greasyfork.org/zh-CN/scripts/453287
// @original-script https://scriptcat.org/zh-CN/script-show-page/379
// @original-author  unrival
// @original-license GPL-3.0-or-later
// ==/UserScript==
(() => {
    // 基础配置项持久化读取
    var jumpType = parseInt(GM_getValue('unrivaljumptype', '1'), 10), // 0:智能模式，1:遍历模式，2:不跳转
        disableMonitor = parseInt(GM_getValue('unrivaldisablemonitor', '0'), 10), // 0:无操作，1:解除多端学习监控
        randomDo = parseInt(GM_getValue('unrivalrandomdo', '1'), 10), // 0:关闭盲猜，1:开启盲猜
        backGround = 0, // 是否对接超星挂机小助手，需要先安装对应脚本
        //-----------------------------------------------------------------------------------------------------
        autoLogin = 0, // 掉线是否自动登录，1为自动登录，需要配置登录信息（仅支持手机号+密码登陆）
        phoneNumber = '', // 自动登录的手机号
        password = ''; // 自动登录的密码
    //-----------------------------------------------------------------------------------------------------
    var rate = GM_getValue('unrivalrate', '1'), // 倍速
        token = GM_getValue('tikutoken', ''), // 题库token
        accuracy = GM_getValue('accuracy', 60), // 章节测试正确率百分比
        ctUrl = 'https://cx.icodef.com/wyn-nb?v=4',
        getQueryVariable = (variable) => {
            let q = _l.search.substring(1),
                v = q.split("&"),
                r = false;
            for (let i = 0, l = v.length; i < l; i++) {
                let p = v[i].split("=");
                p[0] == variable && (r = p[1]);
            }
            return r;
        },
        getCookie = name => `; ${document.cookie}`.split(`; ${name}=`).pop().split(';').shift(),
        isCat = GM_info.scriptHandler == 'ScriptCat',
        _w = unsafeWindow,
        _d = _w.document,
        _l = _w.location,
        _p = _l.protocol,
        _h = _l.host,
        isFf = _w.navigator.userAgent.includes("Firefox"),
        isMobile = _w.navigator.userAgent.includes("Android"),
        stop = false,
        handleImgs = (s) => {
            if (!s || typeof s !== 'string') return '';
            let imgEs = s.match(/(<img([^>]*)>)/g);
            if (imgEs) {
                for (let j = 0, k = imgEs.length; j < k; j++) {
                    let urls = imgEs[j].match(
                        /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/);
                    if (urls) {
                        let url = urls[0].replace(/http[s]?:\/\//, '');
                        s = s.replaceAll(imgEs[j], url);
                    }
                }
            }
            return s;
        },
        trim = (s) => {
            if (!s || typeof s !== 'string') return '';
            return handleImgs(s).replaceAll('javascript:void(0);', '').replaceAll("&nbsp;", ' ').replaceAll("，", ',').replaceAll(
                "。", '.').replaceAll("：", ':').replaceAll("；",
                    ';').replaceAll("？", '?').replaceAll("（", '(').replaceAll("）", ')').replaceAll("“", '"')
                .replaceAll("”", '"').replaceAll("！", '!').replaceAll("-", ' ').replace(/(<([^>]+)>)/ig, '')
                .replace(/^\s+/ig, '').replace(/\s+$/ig, '');
        },
        cleanText = (s) => {
            if (!s || typeof s !== 'string') return '';
            return trim(s)
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/[\u200b-\u200d\uFEFF]/g, '')
                .replace(/\u00a0/g, ' ')
                .replace(/[，,。\.：:；;？\?（\(）\)“”"！!\-_\s]/g, '')
                .toLowerCase();
        },
        // 轻量纯 JS MD5 计算（作为 jq.md5 的兜底，确保稳定生成 32 位小写 MD5）
        localMd5 = (string) => {
            function md5_RotateLeft(lValue, iShiftBits) {
                return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
            }
            function md5_AddUnsigned(lX, lY) {
                var lX4, lY4, lX8, lY8, lResult;
                lX8 = (lX & 0x80000000);
                lY8 = (lY & 0x80000000);
                lX4 = (lX & 0x40000000);
                lY4 = (lY & 0x40000000);
                lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
                if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
                if (lX4 | lY4) {
                    if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                    else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ lX8 ^ lY8);
                }
            }
            function md5_F(x, y, z) { return (x & y) | ((~x) & z); }
            function md5_G(x, y, z) { return (x & z) | (y & (~z)); }
            function md5_H(x, y, z) { return (x ^ y ^ z); }
            function md5_I(x, y, z) { return (y ^ (x | (~z))); }
            function md5_FF(a, b, c, d, x, s, ac) {
                a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
                return md5_AddUnsigned(md5_RotateLeft(a, s), b);
            }
            function md5_GG(a, b, c, d, x, s, ac) {
                a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
                return md5_AddUnsigned(md5_RotateLeft(a, s), b);
            }
            function md5_HH(a, b, c, d, x, s, ac) {
                a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
                return md5_AddUnsigned(md5_RotateLeft(a, s), b);
            }
            function md5_II(a, b, c, d, x, s, ac) {
                a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
                return md5_AddUnsigned(md5_RotateLeft(a, s), b);
            }
            function md5_ConvertToWordArray(str) {
                var lWordCount;
                var lMessageLength = str.length;
                var lNumberOfWords_temp1 = lMessageLength + 8;
                var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
                var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
                var lWordArray = Array(lNumberOfWords - 1);
                var lBytePosition = 0;
                var lByteCount = 0;
                while (lByteCount < lMessageLength) {
                    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                    lBytePosition = (lByteCount % 4) * 8;
                    lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
                    lByteCount++;
                }
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
                lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
                lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
                return lWordArray;
            }
            function md5_WordToHex(lValue) {
                var WordToHexValue = '', WordToHexValue_temp = '', lByte, lCount;
                for (lCount = 0; lCount <= 3; lCount++) {
                    lByte = (lValue >>> (lCount * 8)) & 255;
                    WordToHexValue_temp = '0' + lByte.toString(16);
                    WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
                }
                return WordToHexValue;
            }
            function md5_Utf8Encode(str) {
                return unescape(encodeURIComponent(str));
            }
            string = md5_Utf8Encode(string);
            var x = md5_ConvertToWordArray(string);
            var k, AA, BB, CC, DD, a, b, c, d;
            var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
            var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
            var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
            var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
            a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
            for (k = 0; k < x.length; k += 16) {
                AA = a; BB = b; CC = c; DD = d;
                a = md5_FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
                d = md5_FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
                c = md5_FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
                b = md5_FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
                a = md5_FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
                d = md5_FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
                c = md5_FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
                b = md5_FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
                a = md5_FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
                d = md5_FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
                c = md5_FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
                b = md5_FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
                a = md5_FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
                d = md5_FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
                c = md5_FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
                b = md5_FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
                a = md5_GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
                d = md5_GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
                c = md5_GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
                b = md5_GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
                a = md5_GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
                d = md5_GG(d, a, b, c, x[k + 10], S22, 0x02441453);
                c = md5_GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
                b = md5_GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
                a = md5_GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
                d = md5_GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
                c = md5_GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
                b = md5_GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
                a = md5_GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
                d = md5_GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
                c = md5_GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
                b = md5_GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
                a = md5_HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
                d = md5_HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
                c = md5_HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
                b = md5_HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
                a = md5_HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
                d = md5_HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
                c = md5_HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
                b = md5_HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
                a = md5_HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
                d = md5_HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
                c = md5_HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
                b = md5_HH(b, c, d, a, x[k + 6], S34, 0x04881D05);
                a = md5_HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
                d = md5_HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
                c = md5_HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
                b = md5_HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
                a = md5_II(a, b, c, d, x[k + 0], S41, 0xF4292244);
                d = md5_II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
                c = md5_II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
                b = md5_II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
                a = md5_II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
                d = md5_II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
                c = md5_II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
                b = md5_II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
                a = md5_II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
                d = md5_II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
                c = md5_II(c, d, a, b, x[k + 6], S43, 0xA3014314);
                b = md5_II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
                a = md5_II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
                d = md5_II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
                c = md5_II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
                b = md5_II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
                a = md5_AddUnsigned(a, AA);
                b = md5_AddUnsigned(b, BB);
                c = md5_AddUnsigned(c, CC);
                d = md5_AddUnsigned(d, DD);
            }
            return (md5_WordToHex(a) + md5_WordToHex(b) + md5_WordToHex(c) + md5_WordToHex(d)).toLowerCase();
        },
        cVersion = 999,
        classId = getQueryVariable('clazzid') || getQueryVariable('clazzId') || getQueryVariable('classid') ||
            getQueryVariable('classId'),
        courseId = getQueryVariable('courseid') || getQueryVariable('courseId'),
        UID = getCookie('_uid') || getCookie('UID'),
        FID = getCookie('fid'),
        jq = _w.top.$ || _w.top.jQuery;

    _w.confirm = (msg) => true;
    setInterval(function () {
        _w.confirm = (msg) => true;
    }, 2000);

    if (parseFloat(rate) == parseInt(rate)) {
        rate = parseInt(rate);
    } else {
        rate = parseFloat(rate);
    }

    try {
        _w.top.unrivalReviewMode = GM_getValue('unrivalreview', '0') || '0';
        _w.top.unrivalDoWork = GM_getValue('unrivaldowork', '1') || '1';
        _w.top.unrivalAutoSubmit = GM_getValue('unrivalautosubmit', '1') || '1';
        _w.top.unrivalAutoSave = GM_getValue('unrivalautosave', '0') || '0';
        _w.top.unrivalJumpType = jumpType;
        _w.top.unrivalDisableMonitor = disableMonitor;
        _w.top.unrivalRandomDo = randomDo;
    } catch (e) { }

    if (_l.href.indexOf("knowledge/cards") > 0) {
        let allowBackground = false,
            spans = _d.getElementsByTagName('span');
        for (let i = 0, l = spans.length; i < l; i++) {
            if (spans[i].innerHTML.indexOf('章节未开放') != -1) {
                if (_l.href.indexOf("ut=s") != -1) {
                    _l.href = _l.href.replace("ut=s", "ut=t").replace(/&cpi=[0-9]{1,10}/, '');
                } else if (_l.href.indexOf("ut=t") != -1) {
                    spans[i].innerHTML = '此课程为闯关模式，请回到上一章节完成学习任务！';
                    return;
                }
                break;
            }
        }
        _w.top.unrivalPageRd = String(Math.random());
        if (!isFf) {
            try {
                cVersion = parseInt(navigator.userAgent.match(/Chrome\/[0-9]{2,3}./)[0].replace('Chrome/', '')
                    .replace('.', ''));
            } catch (e) { }
        }
        var busyThread = 0,
            getStr = (str, start, end) => {
                let res = str.substring(str.indexOf(start), str.indexOf(end)).replace(start, '');
                return res;
            },
            scripts = _d.getElementsByTagName('script'),
            param = null;
        for (let i = 0, l = scripts.length; i < l; i++) {
            if (scripts[i].innerHTML.indexOf('mArg = "";') != -1 && scripts[i].innerHTML.indexOf(
                '==UserScript==') == -1) {
                param = getStr(scripts[i].innerHTML, 'try{\n    mArg = ', ';\n}catch(e){');
            }
        }
        if (param == null) {
            return;
        }
        let vrefer;
        try {
            vrefer = _d.getElementsByClassName('ans-attach-online ans-insertvideo-online')[0].src;
        } catch (e) {
            vrefer = _p + '//' + _h + '/ananas/modules/video/index.html?v=2022-1118-1729';
        }
        GM_setValue('vrefer', vrefer);
        GM_setValue('host', _h);
        var tikutoken = GM_getValue("tikutoken", "");

        _d.getElementsByTagName("html")[0].innerHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>学习通小助手 - 2026重构版</title>
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
        <link href="https://z.chaoxing.com/yanshi/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="row" style="margin: 10px;">
            <div class="col-md-6 col-md-offset-3">
                <div class="header clearfix">
                    <h3 class="text-muted" style="margin-top: 20px;margin-bottom: 0;float: left;">
                        <a href="https://scriptcat.org/script-show-page/379" target="_blank" style="color: #337ab7; text-decoration: none;">学习通小助手 v5.0.0 (2026维护版)</a>
                    </h3>
                </div>
                <hr style="margin-top: 10px;margin-bottom: 20px;">

                <div class="panel panel-info" id='remarks'>
                    <div class="panel-heading">脚本维护说明</div>
                    <div class="panel-body">
                        <p><strong>超星学习通小助手 2026 重构维护版</strong></p>
                        <p>1. 修复章节测试正确率整数截断公式与音频任务点 rt 参数覆盖 Bug；</p>
                        <p>2. 移除冗余巨型 Base64 图片体积与远端裸 IP 依赖，MD5 纯本地秒级生成；</p>
                        <p>3. 升级聚合题库系统：支持一之哥哥题库、自定义备用题库 API 以及 AI 大模型（DeepSeek / OpenAI 兼容）智能降级答题；</p>
                        <p>4. 新增填空题自动填入与选项字母精准匹配支持。</p>
                    </div>
                </div>

                <div class="panel panel-info" id="normalQuery">
                    <div class="panel-heading">任务配置</div>
                    <div class="panel-body">
                        <div>
                            <span class="text-warning">提示：高倍速有清进度风险，建议一倍速运行。</span><br/>
                            <div style="margin-top: 8px;">
                                <span style="font-size: 15px;">视频倍速：</span>
                                <input type="number" id="unrivalRate" style="width: 70px; display: inline-block;" class="form-control input-sm">
                                &nbsp;
                                <a id='updateRateButton' class="btn btn-primary btn-sm" style="color: white;">修改倍速</a>
                                &nbsp;|&nbsp;
                                <a id='reviewModeButton' class="btn btn-default btn-sm">复习模式</a>
                                &nbsp;|&nbsp;
                                <a id='fuckMeModeButton' class="btn btn-default btn-sm" href="https://scriptcat.org/zh-CN/script-show-page/379" target="_blank">常见问题</a>
                                &nbsp;
                                <a id='backGround' class="btn btn-default btn-sm" target="view_window">激活挂机</a>
                            </div>

                            <hr style="margin: 10px 0;">

                            <div>
                                <span style="font-size: 15px;">章节测试：</span>
                                <a id='autoDoWorkButton' class="btn btn-default btn-sm">自动答题</a>&nbsp;|&nbsp;
                                <a id='autoSubmitButton' class="btn btn-default btn-sm">自动提交</a>&nbsp;|&nbsp;
                                <a id='autoSaveButton' class="btn btn-default btn-sm">自动保存</a>
                            </div>

                            <div style="margin-top: 8px;">
                                <span style="font-size: 15px;">合格正确率(%)：</span>
                                <input type="number" id="accuracy" style="width: 70px; display: inline-block;" class="form-control input-sm">
                                &nbsp;
                                <a id='updateaccuracy' class="btn btn-primary btn-sm" style="color: white;">修改正确率</a>
                                <span class="text-muted" style="font-size: 12px; margin-left: 8px;">正确率高于此值且允许自动提交时才会提交答案</span>
                            </div>

                            <hr style="margin: 10px 0;">

                            <div>
                                <span style="font-size: 15px;">跳转与运行模式：</span>
                                <select id="unrivalJumpTypeSelect" class="form-control input-sm" style="width: 140px; display: inline-block;">
                                    <option value="1">遍历模式 (推荐)</option>
                                    <option value="0">智能模式</option>
                                    <option value="2">不跳转</option>
                                </select>
                                &nbsp;&nbsp;
                                <a id='disableMonitorButton' class="btn btn-default btn-sm" title="解除多端学习监控">解除多端监控: 关</a>
                                &nbsp;&nbsp;
                                <a id='randomDoButton' class="btn btn-default btn-sm" title="无答案时自动盲猜">无答案盲猜: 开</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-info" id='tikupeizhi' style="width: 100%;">
                    <div class="panel-heading">题库与 AI 答题配置</div>
                    <div class="panel-body">
                        <!-- 1. 主题库配置 -->
                        <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #ddd;">
                            <h4 style="font-size: 15px; margin-top: 0; color: #31708f;">1. 主题库（一之哥哥题库）</h4>
                            <div style="margin-bottom: 5px;">
                                <span style="display: inline-block; width: 80px;">题库Token:</span>
                                <input type="text" id="token" style="width: 240px; display: inline-block;" class="form-control input-sm" placeholder="关注公众号【一之哥哥】获取">
                                &nbsp;
                                <a id='updateToken' class="btn btn-primary btn-sm" style="color: white;">保存 Token</a>
                            </div>
                            <small class="text-muted">关注微信公众号【一之哥哥】发送“token”获取。未配置或无答案时自动降级查询备用题库/AI。</small>
                        </div>

                        <!-- 2. 自定义备用题库 -->
                        <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #ddd;">
                            <h4 style="font-size: 15px; margin-top: 0; color: #31708f;">
                                2. 自定义备用题库 API
                                <a id="toggleCustomTiku" class="btn btn-default btn-xs" style="margin-left: 10px;">已禁用</a>
                            </h4>
                            <div style="margin-bottom: 5px;">
                                <span style="display: inline-block; width: 80px;">API URL:</span>
                                <input type="text" id="customTikuUrl" style="width: 320px; display: inline-block;" class="form-control input-sm" placeholder="https://your-api.com/query">
                            </div>
                            <div style="margin-bottom: 5px;">
                                <span style="display: inline-block; width: 80px;">Token/Key:</span>
                                <input type="text" id="customTikuToken" style="width: 240px; display: inline-block;" class="form-control input-sm" placeholder="可选认证 Token">
                                &nbsp;
                                <a id="saveCustomTiku" class="btn btn-primary btn-sm" style="color: white;">保存备用题库</a>
                            </div>
                            <small class="text-muted">支持常见 GET/POST 接口，兼容 {code: 1, data: "..."} 或 {answer: "..."} 返回格式。</small>
                        </div>

                        <!-- 3. DeepSeek AI 专属配置 -->
                        <div>
                            <h4 style="font-size: 15px; margin-top: 0; color: #31708f;">
                                3. DeepSeek AI 智能答题（V4.1-Flash / V4-Pro）
                                <a id="toggleAiTiku" class="btn btn-default btn-xs" style="margin-left: 10px;">已禁用</a>
                            </h4>
                            <div style="margin-bottom: 6px;">
                                <span style="display: inline-block; width: 80px;">Model 模型:</span>
                                <select id="aiTikuModel" class="form-control input-sm" style="width: 320px; display: inline-block;">
                                    <option value="deepseek-flash">deepseek-flash (推荐：V4.1-Flash 极速高准)</option>
                                    <option value="deepseek-v4-pro">deepseek-v4-pro (高阶推理：V4-Pro)</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 6px;">
                                <span style="display: inline-block; width: 80px;">思考深度:</span>
                                <select id="aiTikuEffort" class="form-control input-sm" style="width: 320px; display: inline-block;">
                                    <option value="low">low (推荐：轻量思考，兼顾速度与准确率)</option>
                                    <option value="none">none (关闭思考：极速秒回，最省 Token)</option>
                                    <option value="high">high (深度思考：适合复杂计算与疑难专业课)</option>
                                    <option value="max">max (极限思考)</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 6px;">
                                <span style="display: inline-block; width: 80px;">API Key:</span>
                                <input type="password" id="aiTikuApiKey" style="width: 320px; display: inline-block;" class="form-control input-sm" placeholder="sk-...">
                            </div>
                            <div style="margin-top: 8px;">
                                <span style="display: inline-block; width: 80px;"></span>
                                <a id="saveAiTiku" class="btn btn-primary btn-sm" style="color: white;">保存配置</a>
                                <a id="testAiTiku" class="btn btn-info btn-sm" style="color: white; margin-left: 6px;">测试 API 与余额</a>
                                <span id="aiTestStatus" style="margin-left: 10px; font-size: 13px; font-weight: bold;"></span>
                            </div>
                            <div style="margin-top: 6px;">
                                <span style="display: inline-block; width: 80px;"></span>
                                <small class="text-muted">底层固定使用 DeepSeek 官方接口。当题库未搜到答案时，自动调用官方大模型答题（单选、多选、判断、填空）。</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-info">
                    <div class="panel-heading">任务列表</div>
                    <div class="panel-body" id='joblist'></div>
                </div>

                <div class="panel panel-info">
                    <div class="panel-heading">运行日志</div>
                    <div class="panel-body">
                        <div id="result" style="overflow:auto;line-height: 30px;">
                            <div id="log">
                                <span style="color: red">[00:00:00]如果此提示不消失，说明页面出现了错误，请联系作者</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-info" id='workPanel' style="display: none;height: 1000px;">
                    <div class="panel-heading">章节测试</div>
                    <div class="panel-body" id='workWindow' style="height: 100%;">
                        <iframe id="frame_content" name="frame_content" src="" frameborder="0" scrolling="auto"
                            style="width: 100%;height: 95%;"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
`;

        var logs = {
            "logArry": [],
            "addLog": function (str, color = "black") {
                if (this.logArry.length >= 50) {
                    this.logArry.splice(0, 1);
                }
                var nowTime = new Date();
                var nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2);
                var nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2);
                var nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2);
                this.logArry.push("<span style='color: " + color + "'>[" + nowHour + ":" + nowMin + ":" +
                    nowSec + "] " + str + "</span>");
                let logStr = "";
                for (let logI = 0, logLen = this.logArry.length; logI < logLen; logI++) {
                    logStr += this.logArry[logI] + "<br>";
                }
                let logElement = _d.getElementById('log');
                if (logElement) {
                    logElement.innerHTML = logStr;
                    logElement.scrollTop = logElement.scrollHeight;
                }
            }
        },
        htmlHook = setInterval(function () {
            if (_d.getElementById('unrivalRate') && _d.getElementById('updateRateButton') && _d
                .getElementById('reviewModeButton') && _d.getElementById('autoDoWorkButton') && _d
                .getElementById('autoSubmitButton') && _d.getElementById('autoSaveButton')) {
                if (!backGround) {
                    _d.getElementById('fuckMeModeButton').style.display = "none";
                }
                allowBackground = Math.round(new Date() / 1000) - parseInt(GM_getValue(
                    'unrivalBackgroundVideoEnable',
                    '6')) < 15;
                if (allowBackground) {
                    _d.getElementById('fuckMeModeButton').setAttribute('href', 'unrivalxxtbackground/');
                }
                clearInterval(htmlHook);
                if (cVersion < 86) {
                    logs.addLog('您的浏览器内核过老，请更新浏览器或者使用火狐/Edge浏览器', 'red');
                    stop = true;
                    return;
                }
                if (isMobile) {
                    logs.addLog('手机浏览器不保证能正常运行此脚本', 'orange');
                }
                _d.addEventListener('visibilitychange', function () {
                    let isH = _d.hidden;
                    if (!isH) {
                        logs.addLog('挂机功能不稳定，不建议长时间最小化窗口', 'orange');
                    }
                });

                // 一之哥哥题库 Token 回显与保存（修复被清空与16位死板限制）
                _d.getElementById('token').value = GM_getValue('tikutoken', '');
                _d.getElementById('updateToken').onclick = function () {
                    var inputToken = _d.getElementById('token').value.trim();
                    GM_setValue('tikutoken', inputToken);
                    token = inputToken;
                    logs.addLog(inputToken ? '一之哥哥题库 Token 已更新为：' + inputToken : '一之哥哥题库 Token 已清空', 'green');
                };

                // 正确率
                _d.getElementById('accuracy').value = accuracy;
                _d.getElementById('updateaccuracy').onclick = function () {
                    var uaccuracy = _d.getElementById('accuracy').value;
                    if (parseFloat(uaccuracy) == parseInt(uaccuracy)) {
                        uaccuracy = parseInt(uaccuracy);
                    } else {
                        uaccuracy = parseFloat(uaccuracy);
                    }
                    GM_setValue('accuracy', uaccuracy);
                    accuracy = uaccuracy;
                    if (uaccuracy >= 0 && uaccuracy <= 100) {
                        logs.addLog('章节测试合格正确率已更新为 ' + uaccuracy + '%', 'green');
                    } else {
                        logs.addLog('奇怪的正确率数值', 'orange');
                    }
                };

                // 倍速
                _d.getElementById('unrivalRate').value = rate;
                _d.getElementById('updateRateButton').onclick = function () {
                    let urate = _d.getElementById('unrivalRate').value;
                    if (parseFloat(urate) == parseInt(urate)) {
                        urate = parseInt(urate);
                    } else {
                        urate = parseFloat(urate);
                    }
                    GM_setValue('unrivalrate', urate);
                    rate = urate;
                    if (urate > 0) {
                        logs.addLog('视频倍速已更新为 ' + urate + ' 倍', 'green');
                    } else {
                        logs.addLog('奇怪的倍速，将会自动跳过视频任务', 'orange');
                    }
                };

                // 挂机激活
                _d.getElementById('backGround').onclick = function () {
                    logs.addLog('挂机激活成功，您现在可以最小化页面了', 'green');
                    _d.getElementById('backGround').setAttribute('class', 'btn btn-success btn-sm');
                    _w.top.backNow = 1;
                };

                // 复习模式
                _d.getElementById('reviewModeButton').onclick = function () {
                    let reviewButton = _d.getElementById('reviewModeButton');
                    if (reviewButton.getAttribute('class').includes('btn-default')) {
                        _d.getElementById('reviewModeButton').setAttribute('class', 'btn btn-success btn-sm');
                        logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过', 'green');
                        GM_setValue('unrivalreview', '1');
                        _w.top.unrivalReviewMode = '1';
                    } else {
                        _d.getElementById('reviewModeButton').setAttribute('class', 'btn btn-default btn-sm');
                        logs.addLog('复习模式已关闭，遇到已完成的视频任务会自动跳过', 'green');
                        GM_setValue('unrivalreview', '0');
                        _w.top.unrivalReviewMode = '0';
                    }
                };

                // 自动答题开关
                _d.getElementById('autoDoWorkButton').onclick = function () {
                    let autoDoWorkButton = _d.getElementById('autoDoWorkButton');
                    if (autoDoWorkButton.getAttribute('class').includes('btn-default')) {
                        _d.getElementById('autoDoWorkButton').setAttribute('class', 'btn btn-success btn-sm');
                        logs.addLog('自动做章节测试已开启', 'green');
                        GM_setValue('unrivaldowork', '1');
                        _w.top.unrivalDoWork = '1';
                    } else {
                        _d.getElementById('autoDoWorkButton').setAttribute('class', 'btn btn-default btn-sm');
                        logs.addLog('自动做章节测试已关闭', 'green');
                        GM_setValue('unrivaldowork', '0');
                        _w.top.unrivalDoWork = '0';
                    }
                };

                // 自动提交开关
                _d.getElementById('autoSubmitButton').onclick = function () {
                    let autoSubmitButton = _d.getElementById('autoSubmitButton');
                    if (autoSubmitButton.getAttribute('class').includes('btn-default')) {
                        _d.getElementById('autoSubmitButton').setAttribute('class', 'btn btn-success btn-sm');
                        logs.addLog('符合标准的章节测试将会自动提交', 'green');
                        GM_setValue('unrivalautosubmit', '1');
                        _w.top.unrivalAutoSubmit = '1';
                    } else {
                        _d.getElementById('autoSubmitButton').setAttribute('class', 'btn btn-default btn-sm');
                        logs.addLog('章节测试将不会自动提交', 'green');
                        GM_setValue('unrivalautosubmit', '0');
                        _w.top.unrivalAutoSubmit = '0';
                    }
                };

                // 自动保存开关
                _d.getElementById('autoSaveButton').onclick = function () {
                    let autoSaveButton = _d.getElementById('autoSaveButton');
                    if (autoSaveButton.getAttribute('class').includes('btn-default')) {
                        _d.getElementById('autoSaveButton').setAttribute('class', 'btn btn-success btn-sm');
                        logs.addLog('不符合提交标准的章节测试将会自动保存', 'green');
                        GM_setValue('unrivalautosave', '1');
                        _w.top.unrivalAutoSave = '1';
                    } else {
                        _d.getElementById('autoSaveButton').setAttribute('class', 'btn btn-default btn-sm');
                        logs.addLog('未达标的章节测试将不会自动保存，等待用户手动处理', 'green');
                        GM_setValue('unrivalautosave', '0');
                        _w.top.unrivalAutoSave = '0';
                    }
                };

                // 跳转模式下拉框可视化
                let jumpSelect = _d.getElementById('unrivalJumpTypeSelect');
                jumpSelect.value = String(jumpType);
                jumpSelect.onchange = function () {
                    jumpType = parseInt(jumpSelect.value, 10);
                    GM_setValue('unrivaljumptype', String(jumpType));
                    _w.top.unrivalJumpType = jumpType;
                    logs.addLog('跳转模式已切换为：' + ['智能模式', '遍历模式', '不跳转'][jumpType], 'green');
                };

                // 解除多端监控可视化
                let monitorBtn = _d.getElementById('disableMonitorButton');
                let updateMonitorBtnUI = () => {
                    if (disableMonitor == 1) {
                        monitorBtn.setAttribute('class', 'btn btn-success btn-sm');
                        monitorBtn.innerText = '解除多端监控: 开';
                    } else {
                        monitorBtn.setAttribute('class', 'btn btn-default btn-sm');
                        monitorBtn.innerText = '解除多端监控: 关';
                    }
                };
                updateMonitorBtnUI();
                monitorBtn.onclick = function () {
                    disableMonitor = disableMonitor == 1 ? 0 : 1;
                    GM_setValue('unrivaldisablemonitor', String(disableMonitor));
                    _w.top.unrivalDisableMonitor = disableMonitor;
                    updateMonitorBtnUI();
                    logs.addLog(disableMonitor == 1 ? '已开启解除多端监控' : '已关闭解除多端监控', 'green');
                };

                // 无答案盲猜可视化
                let randomDoBtn = _d.getElementById('randomDoButton');
                let updateRandomDoBtnUI = () => {
                    if (randomDo == 1) {
                        randomDoBtn.setAttribute('class', 'btn btn-success btn-sm');
                        randomDoBtn.innerText = '无答案盲猜: 开';
                    } else {
                        randomDoBtn.setAttribute('class', 'btn btn-default btn-sm');
                        randomDoBtn.innerText = '无答案盲猜: 关';
                    }
                };
                updateRandomDoBtnUI();
                randomDoBtn.onclick = function () {
                    randomDo = randomDo == 1 ? 0 : 1;
                    GM_setValue('unrivalrandomdo', String(randomDo));
                    _w.top.unrivalRandomDo = randomDo;
                    updateRandomDoBtnUI();
                    logs.addLog(randomDo == 1 ? '已开启无答案盲猜（单选选B/多选全选/判断选错）' : '已关闭无答案盲猜', 'green');
                };

                // 自定义备用题库配置可视化
                _d.getElementById('customTikuUrl').value = GM_getValue('customTikuUrl', '');
                _d.getElementById('customTikuToken').value = GM_getValue('customTikuToken', '');
                let customToggleBtn = _d.getElementById('toggleCustomTiku');
                let updateCustomTikuUI = () => {
                    let isCustomOn = GM_getValue('customTikuEnable', '0') === '1';
                    if (isCustomOn) {
                        customToggleBtn.setAttribute('class', 'btn btn-success btn-xs');
                        customToggleBtn.innerText = '已启用';
                    } else {
                        customToggleBtn.setAttribute('class', 'btn btn-default btn-xs');
                        customToggleBtn.innerText = '已禁用';
                    }
                };
                updateCustomTikuUI();
                customToggleBtn.onclick = function () {
                    let nextState = GM_getValue('customTikuEnable', '0') === '1' ? '0' : '1';
                    GM_setValue('customTikuEnable', nextState);
                    updateCustomTikuUI();
                    logs.addLog(nextState === '1' ? '已启用自定义备用题库' : '已禁用自定义备用题库', 'green');
                };
                _d.getElementById('saveCustomTiku').onclick = function () {
                    let u = _d.getElementById('customTikuUrl').value.trim();
                    let t = _d.getElementById('customTikuToken').value.trim();
                    GM_setValue('customTikuUrl', u);
                    GM_setValue('customTikuToken', t);
                    logs.addLog('自定义备用题库配置已保存', 'green');
                };

                // DeepSeek AI 专属配置初始化与绑定
                let savedModel = GM_getValue('aiTikuModel', 'deepseek-flash');
                if (!['deepseek-flash', 'deepseek-v4-pro'].includes(savedModel)) {
                    savedModel = 'deepseek-flash';
                    GM_setValue('aiTikuModel', 'deepseek-flash');
                }
                _d.getElementById('aiTikuModel').value = savedModel;

                let savedEffort = GM_getValue('aiTikuEffort', 'low');
                if (!['low', 'none', 'high', 'max'].includes(savedEffort)) {
                    savedEffort = 'low';
                    GM_setValue('aiTikuEffort', 'low');
                }
                _d.getElementById('aiTikuEffort').value = savedEffort;

                _d.getElementById('aiTikuApiKey').value = GM_getValue('aiTikuApiKey', '');

                let aiToggleBtn = _d.getElementById('toggleAiTiku');
                let updateAiTikuUI = () => {
                    let isAiOn = GM_getValue('aiTikuEnable', '0') === '1';
                    if (isAiOn) {
                        aiToggleBtn.setAttribute('class', 'btn btn-success btn-xs');
                        aiToggleBtn.innerText = '已启用';
                    } else {
                        aiToggleBtn.setAttribute('class', 'btn btn-default btn-xs');
                        aiToggleBtn.innerText = '已禁用';
                    }
                };
                updateAiTikuUI();
                aiToggleBtn.onclick = function () {
                    let nextState = GM_getValue('aiTikuEnable', '0') === '1' ? '0' : '1';
                    GM_setValue('aiTikuEnable', nextState);
                    updateAiTikuUI();
                    logs.addLog(nextState === '1' ? '已启用 DeepSeek AI 智能答题' : '已禁用 DeepSeek AI 智能答题', 'green');
                };

                _d.getElementById('saveAiTiku').onclick = function () {
                    let k = _d.getElementById('aiTikuApiKey').value.trim();
                    let m = _d.getElementById('aiTikuModel').value;
                    let ef = _d.getElementById('aiTikuEffort').value;
                    GM_setValue('aiTikuApiKey', k);
                    GM_setValue('aiTikuModel', m);
                    GM_setValue('aiTikuEffort', ef);
                    logs.addLog('DeepSeek 配置已保存 (模型: ' + m + ' | 思考深度: ' + ef + ')', 'green');
                };

                // 测试 API 与余额双重检测
                let testAiBtn = _d.getElementById('testAiTiku');
                let testStatusSpan = _d.getElementById('aiTestStatus');
                testAiBtn.onclick = function () {
                    let apiKey = _d.getElementById('aiTikuApiKey').value.trim();
                    let model = _d.getElementById('aiTikuModel').value;
                    let effort = _d.getElementById('aiTikuEffort').value;

                    if (!apiKey) {
                        testStatusSpan.innerHTML = '<span style="color: red;">❌ 请先填写 API Key</span>';
                        logs.addLog('请先填写 DeepSeek API Key', 'red');
                        return;
                    }

                    // 自动持久化保存配置
                    GM_setValue('aiTikuApiKey', apiKey);
                    GM_setValue('aiTikuModel', model);
                    GM_setValue('aiTikuEffort', effort);

                    let resetBtn = () => {
                        testAiBtn.innerText = '测试 API 与余额';
                        testAiBtn.style.pointerEvents = 'auto';
                        testAiBtn.style.opacity = '1';
                    };

                    testAiBtn.innerText = '⏳ 测试中...';
                    testAiBtn.style.pointerEvents = 'none';
                    testAiBtn.style.opacity = '0.6';
                    testStatusSpan.innerHTML = '<span style="color: #31708f;">⏳ 正在检测账户余额与模型连通性...</span>';

                    // 第一步：请求余额接口
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://api.deepseek.com/user/balance',
                        headers: {
                            'Authorization': 'Bearer ' + apiKey
                        },
                        timeout: 8000,
                        onload: function (balRes) {
                            if (balRes.status === 401) {
                                resetBtn();
                                testStatusSpan.innerHTML = '<span style="color: red;">❌ API Key 无效或已过期 (HTTP 401)</span>';
                                logs.addLog('DeepSeek 余额查询失败：API Key 无效或已过期 (HTTP 401)', 'red');
                                return;
                            }

                            let balanceStr = '';
                            let isAvailable = true;
                            try {
                                let balJson = JSON.parse(balRes.responseText);
                                if (balJson.is_available !== undefined) {
                                    isAvailable = balJson.is_available;
                                }
                                if (balJson.balance_infos && balJson.balance_infos.length > 0) {
                                    let bInfo = balJson.balance_infos[0];
                                    let total = bInfo.total_balance !== undefined ? bInfo.total_balance : '';
                                    let curr = bInfo.currency || 'CNY';
                                    balanceStr = total + ' ' + curr;
                                }
                            } catch (e) { }

                            if (!balanceStr) {
                                balanceStr = isAvailable ? '充足' : '0.00 CNY';
                            }

                            if (isAvailable === false) {
                                resetBtn();
                                testStatusSpan.innerHTML = '<span style="color: red;">❌ 账户余额不足 (余额: ' + balanceStr + ')</span>';
                                logs.addLog('DeepSeek 账户余额不足 (余额: ' + balanceStr + ')', 'red');
                                return;
                            }

                            // 第二步：请求对话接口快速验证连通性
                            let startTime = Date.now();
                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: 'https://api.deepseek.com/chat/completions',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + apiKey
                                },
                                data: JSON.stringify({
                                    model: model,
                                    messages: [
                                        { role: 'user', content: '单选题：1+1等于几？A.1 B.2。请仅输出正确选项字母，不要任何解释。' }
                                    ],
                                    stream: false,
                                    reasoning_effort: 'none',
                                    thinking: { type: 'disabled' }
                                }),
                                timeout: 15000,
                                onload: function (chatRes) {
                                    resetBtn();
                                    let ms = Date.now() - startTime;
                                    if (chatRes.status === 200) {
                                        try {
                                            let chatJson = JSON.parse(chatRes.responseText);
                                            let reply = chatJson.choices && chatJson.choices[0] && chatJson.choices[0].message && chatJson.choices[0].message.content;
                                            if (reply) {
                                                reply = reply.trim();
                                                testStatusSpan.innerHTML = '<span style="color: green;">✅ 可用 | 余额: ' + balanceStr + ' | 响应: "' + reply + '" (' + ms + 'ms)</span>';
                                                logs.addLog('DeepSeek 测试成功！可用余额: ' + balanceStr + ' | 模型: ' + model + ' | 响应: "' + reply + '" (' + ms + 'ms)', 'green');
                                                return;
                                            }
                                        } catch (e) { }
                                    }

                                    // 错误处理与解析
                                    let errMsg = '';
                                    try {
                                        let errJson = JSON.parse(chatRes.responseText);
                                        if (errJson.error && errJson.error.message) {
                                            errMsg = errJson.error.message;
                                        }
                                    } catch (e) { }
                                    let errDisplay = '❌ 连通测试失败 [HTTP ' + chatRes.status + ']: ' + (errMsg || chatRes.statusText || '请求异常');
                                    testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                    logs.addLog('DeepSeek 连通测试失败: ' + errDisplay, 'red');
                                },
                                onerror: function (err) {
                                    resetBtn();
                                    let errDisplay = '❌ 对话接口网络错误: ' + (err.error || '连接异常');
                                    testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                    logs.addLog('DeepSeek 连通错误: ' + errDisplay, 'red');
                                },
                                ontimeout: function () {
                                    resetBtn();
                                    testStatusSpan.innerHTML = '<span style="color: red;">❌ 对话接口请求超时 (15s)</span>';
                                    logs.addLog('DeepSeek 连通请求超时 (15s)', 'red');
                                }
                            });
                        },
                        onerror: function (err) {
                            resetBtn();
                            let errDisplay = '❌ 余额接口网络错误: ' + (err.error || '连接异常');
                            testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                            logs.addLog('DeepSeek 余额请求错误: ' + errDisplay, 'red');
                        },
                        ontimeout: function () {
                            resetBtn();
                            testStatusSpan.innerHTML = '<span style="color: red;">❌ 余额接口请求超时 (8s)</span>';
                            logs.addLog('DeepSeek 余额请求超时 (8s)', 'red');
                        }
                    });
                };
            }
        }, 100),
        loopjob = () => {
            if (_w.top.unrivalScriptList && _w.top.unrivalScriptList.length > 1) {
                logs.addLog('您同时开启了多个刷课脚本，可能导致异常记录！', 'red');
            }
            if (cVersion < 8.6 * 10) {
                logs.addLog('您的浏览器内核过老，请更新浏览器或者使用火狐/Edge浏览器', 'red');
                stop = true;
                return;
            }
            if (stop) {
                return;
            }
            let missionli = missionList;
            // 修复 missionList 判空逻辑
            if (Object.keys(missionli).length === 0) {
                setTimeout(loopjob, 500);
                return;
            }
            for (let itemName in missionli) {
                if (missionli[itemName]['running']) {
                    setTimeout(loopjob, 500);
                    return;
                }
            }
            for (let itemName in missionli) {
                if (!missionli[itemName]['done']) {
                    switch (missionli[itemName]['type']) {
                        case 'video':
                            doVideo(missionli[itemName]);
                            break;
                        case 'document':
                            doDocument(missionli[itemName]);
                            break;
                        case 'work':
                            doWork(missionli[itemName]);
                            break;
                    }
                    setTimeout(loopjob, 500);
                    return;
                }
            }
            if (busyThread <= 0) {
                let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : jumpType;
                if (curJump != 2) {
                    _w.top.jump = true;
                    logs.addLog('所有任务处理完毕，5秒后自动进入下一章', 'green');
                } else {
                    logs.addLog('所有任务处理完毕，用户设置为不跳转，脚本已就绪', 'green');
                }
            } else {
                setTimeout(loopjob, 500);
            }
        },
        readyCheck = () => {
            setTimeout(function () {
                try {
                    if (!isCat) {
                        logs.addLog(
                            '推荐使用 <a href="https://docs.scriptcat.org/use/#%E5%AE%89%E8%A3%85%E6%8F%92%E4%BB%B6" target="_blank">ScriptCat 脚本猫</a> 运行本脚本以获得最佳体验',
                            'orange');
                    }
                    if (_w.top.unrivalReviewMode == '1') {
                        logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过', 'green');
                        _d.getElementById('reviewModeButton').setAttribute('class', ['btn btn-default btn-sm',
                            'btn btn-success btn-sm'
                        ][_w.top.unrivalReviewMode]);
                    }
                    if (_w.top.unrivalDoWork == '1') {
                        logs.addLog('自动做章节测试已开启', 'green');
                        _d.getElementById('autoDoWorkButton').setAttribute('class', ['btn btn-default btn-sm',
                            'btn btn-success btn-sm'
                        ][_w.top.unrivalDoWork]);
                    }
                    _d.getElementById('autoSubmitButton').setAttribute('class', ['btn btn-default btn-sm',
                        'btn btn-success btn-sm'
                    ][_w.top.unrivalAutoSubmit]);
                    _d.getElementById('autoSaveButton').setAttribute('class', ['btn btn-default btn-sm',
                        'btn btn-success btn-sm'
                    ][_w.top.unrivalAutoSave]);
                } catch (e) {
                    console.log(e);
                    readyCheck();
                    return;
                }
            }, 500);
        };

        readyCheck();
        try {
            var pageData = JSON.parse(param);
        } catch (e) {
            let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : jumpType;
            if (curJump != 2) {
                _w.top.jump = true;
                logs.addLog('此页无任务，5秒后自动进入下一章', 'green');
            } else {
                logs.addLog('此页无任务，用户设置为不跳转，脚本已就绪', 'green');
            }
            return;
        }

        var data = pageData['defaults'],
            jobList = [],
            classId = data['clazzId'],
            chapterId = data['knowledgeid'],
            reportUrl = data['reportUrl'],
            ktoken = data['ktoken'];
        UID = UID || data['userid'];
        FID = FID || data['fid'];

        for (let i = 0, l = pageData['attachments'].length; i < l; i++) {
            let item = pageData['attachments'][i];
            if (item['job'] != true || item['isPassed'] == true) {
                if (_w.top.unrivalReviewMode == '1' && item['type'] == 'video') {
                    jobList.push(item);
                }
                continue;
            } else {
                jobList.push(item);
            }
        }

        var video_getReady = (item) => {
            let statusUrl = _p + '//' + _h + '/ananas/status/' + item['property']['objectid'] + '?k=' +
                FID + '&flag=normal&_dc=' + String(Math.round(new Date())),
                doubleSpeed = item['property']['doublespeed'];
            busyThread += 1;
            GM_xmlhttpRequest({
                method: "get",
                headers: {
                    'Host': _h,
                    'Referer': vrefer,
                    'Sec-Fetch-Site': 'same-origin'
                },
                url: statusUrl,
                onload: function (res) {
                    try {
                        busyThread -= 1;
                        let videoInfo = JSON.parse(res.responseText),
                            duration = videoInfo['duration'],
                            dtoken = videoInfo['dtoken'];
                        if (duration == undefined) {
                            _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    [无效视频] ${item['property']['name']}
                                </div>
                            </div>`;
                            return;
                        }
                        missionList['m' + item['jobid']] = {
                            'module': item['property']['module'],
                            'type': 'video',
                            'dtoken': dtoken,
                            'duration': duration,
                            'objectId': item['property']['objectid'],
                            'rt': item['property']['rt'] || '0.9',
                            'otherInfo': item['otherInfo'],
                            'doublespeed': doubleSpeed,
                            'jobid': item['jobid'],
                            'name': item['property']['name'],
                            'done': false,
                            'running': false
                        };
                        _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    [视频] ${item['property']['name']}
                                </div>
                            </div>`;
                    } catch (e) { }
                },
                onerror: function (err) {
                    console.log(err);
                    logs.addLog('获取任务详情失败：' + (err.error || '网络错误'), 'red');
                }
            });
        },
        doVideo = (item) => {
            if (rate <= 0) {
                missionList['m' + item['jobid']]['running'] = true;
                logs.addLog('倍速不合法，视频已跳过', 'orange');
                setTimeout(function () {
                    missionList['m' + item['jobid']]['running'] = false;
                    missionList['m' + item['jobid']]['done'] = true;
                }, 5000);
                return;
            }
            if (allowBackground && backGround) {
                if (_w.top.document.getElementsByClassName('catalog_points_sa').length > 0 || _w.top.document
                    .getElementsByClassName('lock').length > 0) {
                    logs.addLog('您已安装超星挂机小助手，但此课程可能为闯关模式，不支持后台挂机，将为您在线完成', 'blue');
                } else {
                    item['userid'] = UID;
                    item['classId'] = classId;
                    item['review'] = [false, true][_w.top.unrivalReviewMode];
                    item['reportUrl'] = reportUrl;
                    item['rt'] = missionList['m' + item['jobid']]['rt'];
                    GM_setValue('unrivalBackgroundVideo', item);
                    _d.cookie = "videojs_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    logs.addLog(
                        '您已安装超星挂机小助手，已添加至后台任务，<a href="unrivalxxtbackground/" target="view_window">点我查看</a>',
                        'green');
                    missionList['m' + item['jobid']]['running'] = true;
                    setTimeout(function () {
                        missionList['m' + item['jobid']]['running'] = false;
                        missionList['m' + item['jobid']]['done'] = true;
                    }, 5000);
                    return;
                }
            }
            let videojs_id = String(parseInt(Math.random() * 9999999));
            _d.cookie = 'videojs_id=' + videojs_id + ';path=/';
            logs.addLog('开始学习：' + item['name'] + '，倍速：' + String(rate) + '倍');
            logs.addLog('观看信息每60秒上报一次，请耐心等待', 'green');

            let curDisableMonitor = (_w.top && _w.top.unrivalDisableMonitor !== undefined) ? _w.top.unrivalDisableMonitor : disableMonitor;
            if (curDisableMonitor) {
                logs.addLog('已开启解除多端学习监控', 'orange');
            }

            // 区分音频与视频，并确保音频 rt 参数不被覆盖为 0.9
            const isAudio = (item['module'] && item['module'].includes('audio'));
            let dtype = isAudio ? 'Audio' : 'Video';
            let rt = isAudio ? '' : (missionList['m' + item['jobid']]['rt'] || '0.9');

            let playTime = 0,
                playsTime = 0,
                isdrag = '3',
                times = 0,
                first = true,
                loop = setInterval(function () {
                    if (rate <= 0) {
                        clearInterval(loop);
                        logs.addLog('倍速不合法，视频已跳过', 'orange');
                        setTimeout(function () {
                            missionList['m' + item['jobid']]['running'] = false;
                            missionList['m' + item['jobid']]['done'] = true;
                        }, 5000);
                        return;
                    }
                    // 保证音频 rt 参数始终为空字符串，视频则正常读取 rt
                    rt = isAudio ? '' : (missionList['m' + item['jobid']]['rt'] || '0.9');
                    dtype = isAudio ? 'Audio' : 'Video';

                    playsTime += rate;
                    playTime = Math.ceil(playsTime);
                    if (times == 0 || times % 30 == 0 || playTime >= item['duration']) {
                        if (first) {
                            playTime = 0;
                        }
                        if (playTime >= item['duration']) {
                            clearInterval(loop);
                            playTime = item['duration'];
                            isdrag = '4';
                        } else if (playTime > 0) {
                            isdrag = '0';
                        }

                        // 本地计算 MD5，彻底移除远端 getEnc.php 裸 IP 依赖
                        let strEc = `[${classId}][${UID}][${item['jobid']}][${item['objectId']}][${playTime * 1000}][d_yHJ!$pdA~5][${item['duration'] * 1000}][0_${item['duration']}]`;
                        let enc = '';
                        if (typeof jq !== 'undefined' && jq && typeof jq.md5 === 'function') {
                            enc = jq.md5(strEc);
                        } else {
                            enc = localMd5(strEc);
                        }
                        if (!enc || enc.length !== 32) {
                            enc = localMd5(strEc);
                        }

                        let reportsUrl = reportUrl + '/' + item['dtoken'] +
                            '?clazzId=' + classId + '&playingTime=' + playTime +
                            '&duration=' + item['duration'] + '&clipTime=0_' + item['duration'] +
                            '&objectId=' + item['objectId'] + '&otherInfo=' + item['otherInfo'] +
                            '&jobid=' + item['jobid'] + '&userid=' + UID + '&isdrag=' + isdrag +
                            '&view=pc&enc=' + enc + '&rt=' + rt + '&dtype=' + dtype +
                            '&_t=' + String(Math.round(new Date()));

                        busyThread += 1;
                        var _bold_playTime = playTime;
                        GM_xmlhttpRequest({
                            method: "get",
                            headers: {
                                'Host': _h,
                                'Referer': vrefer,
                                'Sec-Fetch-Site': 'same-origin',
                                'Content-Type': 'application/json'
                            },
                            url: reportsUrl,
                            onload: function (res) {
                                try {
                                    let today = new Date(),
                                        todayStr = today.getFullYear() + 'd' + today.getMonth() + 'd' + today.getDate(),
                                        timelong = GM_getValue('unrivaltimelong', {});
                                    if (timelong[UID] == undefined || timelong[UID]['today'] != todayStr) {
                                        timelong[UID] = {
                                            'time': 0,
                                            'today': todayStr
                                        };
                                    } else {
                                        timelong[UID]['time']++;
                                    }
                                    GM_setValue('unrivaltimelong', timelong);
                                    busyThread -= 1;
                                    if (timelong[UID]['time'] / 60 > 22 && item['doublespeed'] == 0 && _w.top.unrivalReviewMode == '0') {
                                        clearInterval(loop);
                                        logs.addLog('今日学习时间过长，已暂停，建议明日继续学习', 'red');
                                        setTimeout(function () {
                                            missionList['m' + item['jobid']]['running'] = false;
                                            missionList['m' + item['jobid']]['done'] = true;
                                        }, 5000);
                                        return;
                                    }
                                    let ispass = JSON.parse(res.responseText);
                                    first = false;
                                    if (ispass['isPassed'] && _w.top.unrivalReviewMode == '0') {
                                        logs.addLog('视频任务已完成', 'green');
                                        missionList['m' + item['jobid']]['running'] = false;
                                        missionList['m' + item['jobid']]['done'] = true;
                                        clearInterval(loop);
                                        return;
                                    } else if (isdrag == '4') {
                                        if (_w.top.unrivalReviewMode == '1') {
                                            logs.addLog('视频已观看完毕', 'green');
                                        } else {
                                            logs.addLog('视频已观看完毕，等待超星更新进度', 'orange');
                                        }
                                        missionList['m' + item['jobid']]['running'] = false;
                                        missionList['m' + item['jobid']]['done'] = true;
                                        try {
                                            clearInterval(loop);
                                        } catch (e) { }
                                    } else {
                                        logs.addLog(item['name'] + ' 已观看 ' + _bold_playTime + ' 秒，剩余大约 ' +
                                            String(item['duration'] - _bold_playTime) + ' 秒');
                                    }
                                } catch (e) {
                                    console.log(e);
                                    if (res.responseText && res.responseText.indexOf('验证码') >= 0) {
                                        logs.addLog('已被超星风控，请 <a href="' + reportsUrl + '" target="_blank">点击此处手动处理</a>，60秒后自动刷新', 'red');
                                        missionList['m' + item['jobid']]['running'] = false;
                                        clearInterval(loop);
                                        stop = true;
                                        setTimeout(function () {
                                            _l.reload();
                                        }, 60000);
                                        return;
                                    }
                                    logs.addLog('超星服务器响应异常，将在10秒后重试', 'red');
                                    times = -10;
                                    return;
                                }
                            },
                            onerror: function (err) {
                                console.log(err);
                                logs.addLog('观看任务汇报失败：' + (err.error || '网络错误'), 'red');
                                missionList['m' + item['jobid']]['running'] = false;
                                clearInterval(loop);
                            }
                        });
                    }
                    times += 1;
                }, 1000);
            missionList['m' + item['jobid']]['running'] = true;
        },
        doDocument = (item) => {
            missionList['m' + item['jobid']]['running'] = true;
            logs.addLog('开始学习文档：' + item['name']);
            setTimeout(function () {
                busyThread += 1;
                GM_xmlhttpRequest({
                    method: "get",
                    url: _p + '//' + _h + '/ananas/job/document?jobid=' + item['jobid'] +
                        '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&clazzid=' +
                        classId + '&jtoken=' + item['jtoken'],
                    onload: function (res) {
                        try {
                            busyThread -= 1;
                            let ispass = JSON.parse(res.responseText);
                            if (ispass['status']) {
                                logs.addLog('文档任务已完成', 'green');
                                missionList['m' + item['jobid']]['running'] = false;
                                missionList['m' + item['jobid']]['done'] = true;
                            } else {
                                logs.addLog('文档任务未完成，可能是超星网络延迟', 'red');
                                missionList['m' + item['jobid']]['running'] = false;
                                missionList['m' + item['jobid']]['done'] = true;
                            }
                        } catch (e) {
                            console.log(e);
                            logs.addLog('文档任务解析错误', 'red');
                            missionList['m' + item['jobid']]['running'] = false;
                            missionList['m' + item['jobid']]['done'] = true;
                        }
                    },
                    onerror: function (err) {
                        busyThread -= 1;
                        console.log(err);
                        logs.addLog('文档任务请求错误', 'red');
                        missionList['m' + item['jobid']]['running'] = false;
                        missionList['m' + item['jobid']]['done'] = true;
                    }
                });
            }, parseInt(Math.random() * 2000 + 4000, 10));
        },
        doWork = (item) => {
            missionList['m' + item['jobid']]['running'] = true;
            logs.addLog('开始刷章节测试：' + item['name']);
            logs.addLog('您设置的答题合格正确率为：' + String(accuracy) + '%，只有达到此标准才会自动提交', 'blue');
            _d.getElementById('workPanel').style.display = 'block';
            _d.getElementById('frame_content').src = _p + '//' + _h + '/work/phone/work?workId=' + item['workid']
                .replace('work-', '') + '&courseId=' + courseId + '&clazzId=' + classId + '&knowledgeid=' +
                chapterId + '&jobId=' + item['jobid'] + '&enc=' + item['enc'];
            _w.top.unrivalWorkInfo = '';
            _w.top.unrivalDoneWorkId = '';

            // 修复定时器泄漏：保存 timer ID 并在完成时清理
            let workInfoTimer = setInterval(function () {
                if (_w.top.unrivalWorkInfo != '') {
                    logs.addLog(_w.top.unrivalWorkInfo);
                    _w.top.unrivalWorkInfo = '';
                }
            }, 100);

            let checkcross = setInterval(function () {
                if (_w.top.unrivalWorkDone == false) {
                    clearInterval(checkcross);
                    return;
                }
                let ifW = _d.getElementById('frame_content').contentWindow;
                try {
                    ifW.location.href;
                } catch (e) {
                    console.log(e);
                    if (e.message.indexOf('cross-origin') != -1) {
                        clearInterval(checkcross);
                        _w.top.unrivalWorkDone = true;
                        return;
                    }
                }
            }, 2000);

            let workDoneInterval = setInterval(function () {
                if (_w.top.unrivalWorkDone) {
                    _w.top.unrivalWorkDone = false;
                    clearInterval(workDoneInterval);
                    clearInterval(workInfoTimer);
                    clearInterval(checkcross);
                    _w.top.unrivalDoneWorkId = '';
                    _d.getElementById('workPanel').style.display = 'none';
                    _d.getElementById('frame_content').src = '';
                    setTimeout(function () {
                        missionList['m' + item['jobid']]['running'] = false;
                        missionList['m' + item['jobid']]['done'] = true;
                    }, 5000);
                }
            }, 500);
        },
        missionList = {}; // 修复 missionList 初始化为对象

        if (jobList.length <= 0) {
            let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : jumpType;
            if (curJump != 2) {
                _w.top.jump = true;
                logs.addLog('此页无任务，5秒后自动进入下一章', 'green');
            } else {
                logs.addLog('此页无任务，用户设置为不跳转，脚本已就绪', 'green');
            }
            return;
        }

        for (let i = 0, l = jobList.length; i < l; i++) {
            let item = jobList[i];
            if (item['type'] == 'video') {
                video_getReady(item);
            } else if (item['type'] == 'document') {
                missionList['m' + item['jobid']] = {
                    'type': 'document',
                    'jtoken': item['jtoken'],
                    'jobid': item['jobid'],
                    'name': item['property']['name'],
                    'done': false,
                    'running': false
                };
                _d.getElementById('joblist').innerHTML += `
                    <div class="panel panel-default">
                        <div class="panel-body">
                            [文档] ${item['property']['name']}
                        </div>
                    </div>`;
            } else if (item['type'] == 'workid' && _w.top.unrivalDoWork == '1') {
                missionList['m' + item['jobid']] = {
                    'type': 'work',
                    'workid': item['property']['workid'],
                    'jobid': item['jobid'],
                    'name': item['property']['title'],
                    'enc': item['enc'],
                    'done': false,
                    'running': false
                };
                _d.getElementById('joblist').innerHTML += `
                    <div class="panel panel-default">
                        <div class="panel-body">
                            [测试] ${item['property']['title']}
                        </div>
                    </div>`;
            } else {
                try {
                    let jobName = item['property']['name'] || item['property']['title'] || '未知任务';
                    _d.getElementById('joblist').innerHTML += `
                        <div class="panel panel-default">
                            <div class="panel-body">
                                已跳过：${jobName}
                            </div>
                        </div>`;
                } catch (e) { }
            }
        }
        loopjob();
    } else if (_l.href.includes("mycourse/studentstudy")) {
        var audiofile = 'data:audio/ogg;base64,T2dnUwACAAAAAAAAAABwRPFFAAAAAGFtEqwBHgF2b3JiaXMAAAAAAUAfAAAAAAAAUHgAAAAAAACZAU9nZ1MAAAAAAAAAAAAAcETxRQEAAAA7J4IBDP8F////////////tQN2b3JiaXMvAAAAWGlwaC5PcmcgbGliVm9yYmlzIEkgMjAxNDAxMjIgKFR1cnBha8OkcsOkamlpbikGAAAAJQAAAEVOQ09ERVI9U291bmQgU3R1ZGlvLCBsaWJWb3JiaXMgMS4zLjEbAAAAQUxCVU0gQVJUSVNUPUFkdmVudHVyZSBMYW5kFAAAAEFMQlVNPUFkdmVudHVyZSBMYW5kIQAAAEVOQ09ESU5HIEFQUExJQ0FUSU9OPVNvdW5kIFN0dWRpbxUAAABBUlRJU1Q9QWR2ZW50dXJlIExhbmQjAAAAVElUTEU9RW1wdHkgTG9vcCBGb3IgSlMgUGVyZm9ybWFuY2UBBXZvcmJpcxJCQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBADIAAAYhiGH3knMkFOQSSYpVcw5CKH1DjnlFGTSUsaYYoxRzpBTDDEFMYbQKYUQ1E45pQwiCENInWTOIEs96OBi5zgQGrIiAIgCAACMQYwhxpBzDEoGIXKOScggRM45KZ2UTEoorbSWSQktldYi55yUTkompbQWUsuklNZCKwUAAAQ4AAAEWAiFhqwIAKIAABCDkFJIKcSUYk4xh5RSjinHkFLMOcWYcowx6CBUzDHIHIRIKcUYc0455iBkDCrmHIQMMgEAAAEOAAABFkKhISsCgDgBAIMkaZqlaaJoaZooeqaoqqIoqqrleabpmaaqeqKpqqaquq6pqq5seZ5peqaoqp4pqqqpqq5rqqrriqpqy6ar2rbpqrbsyrJuu7Ks256qyrapurJuqq5tu7Js664s27rkearqmabreqbpuqrr2rLqurLtmabriqor26bryrLryratyrKua6bpuqKr2q6purLtyq5tu7Ks+6br6rbqyrquyrLu27au+7KtC7vourauyq6uq7Ks67It67Zs20LJ81TVM03X9UzTdVXXtW3VdW1bM03XNV1XlkXVdWXVlXVddWVb90zTdU1XlWXTVWVZlWXddmVXl0XXtW1Vln1ddWVfl23d92VZ133TdXVblWXbV2VZ92Vd94VZt33dU1VbN11X103X1X1b131htm3fF11X11XZ1oVVlnXf1n1lmHWdMLqurqu27OuqLOu+ruvGMOu6MKy6bfyurQvDq+vGseu+rty+j2rbvvDqtjG8um4cu7Abv+37xrGpqm2brqvrpivrumzrvm/runGMrqvrqiz7uurKvm/ruvDrvi8Mo+vquirLurDasq/Lui4Mu64bw2rbwu7aunDMsi4Mt+8rx68LQ9W2heHVdaOr28ZvC8PSN3a+AACAAQcAgAATykChISsCgDgBAAYhCBVjECrGIIQQUgohpFQxBiFjDkrGHJQQSkkhlNIqxiBkjknIHJMQSmiplNBKKKWlUEpLoZTWUmotptRaDKG0FEpprZTSWmopttRSbBVjEDLnpGSOSSiltFZKaSlzTErGoKQOQiqlpNJKSa1lzknJoKPSOUippNJSSam1UEproZTWSkqxpdJKba3FGkppLaTSWkmptdRSba21WiPGIGSMQcmck1JKSamU0lrmnJQOOiqZg5JKKamVklKsmJPSQSglg4xKSaW1kkoroZTWSkqxhVJaa63VmFJLNZSSWkmpxVBKa621GlMrNYVQUgultBZKaa21VmtqLbZQQmuhpBZLKjG1FmNtrcUYSmmtpBJbKanFFluNrbVYU0s1lpJibK3V2EotOdZaa0ot1tJSjK21mFtMucVYaw0ltBZKaa2U0lpKrcXWWq2hlNZKKrGVklpsrdXYWow1lNJiKSm1kEpsrbVYW2w1ppZibLHVWFKLMcZYc0u11ZRai621WEsrNcYYa2415VIAAMCAAwBAgAlloNCQlQBAFAAAYAxjjEFoFHLMOSmNUs45JyVzDkIIKWXOQQghpc45CKW01DkHoZSUQikppRRbKCWl1losAACgwAEAIMAGTYnFAQoNWQkARAEAIMYoxRiExiClGIPQGKMUYxAqpRhzDkKlFGPOQcgYc85BKRljzkEnJYQQQimlhBBCKKWUAgAAChwAAAJs0JRYHKDQkBUBQBQAAGAMYgwxhiB0UjopEYRMSielkRJaCylllkqKJcbMWomtxNhICa2F1jJrJcbSYkatxFhiKgAA7MABAOzAQig0ZCUAkAcAQBijFGPOOWcQYsw5CCE0CDHmHIQQKsaccw5CCBVjzjkHIYTOOecghBBC55xzEEIIoYMQQgillNJBCCGEUkrpIIQQQimldBBCCKGUUgoAACpwAAAIsFFkc4KRoEJDVgIAeQAAgDFKOSclpUYpxiCkFFujFGMQUmqtYgxCSq3FWDEGIaXWYuwgpNRajLV2EFJqLcZaQ0qtxVhrziGl1mKsNdfUWoy15tx7ai3GWnPOuQAA3AUHALADG0U2JxgJKjRkJQCQBwBAIKQUY4w5h5RijDHnnENKMcaYc84pxhhzzjnnFGOMOeecc4wx55xzzjnGmHPOOeecc84556CDkDnnnHPQQeicc845CCF0zjnnHIQQCgAAKnAAAAiwUWRzgpGgQkNWAgDhAACAMZRSSimllFJKqKOUUkoppZRSAiGllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimVUkoppZRSSimllFJKKaUAIN8KBwD/BxtnWEk6KxwNLjRkJQAQDgAAGMMYhIw5JyWlhjEIpXROSkklNYxBKKVzElJKKYPQWmqlpNJSShmElGILIZWUWgqltFZrKam1lFIoKcUaS0qppdYy5ySkklpLrbaYOQelpNZaaq3FEEJKsbXWUmuxdVJSSa211lptLaSUWmstxtZibCWlllprqcXWWkyptRZbSy3G1mJLrcXYYosxxhoLAOBucACASLBxhpWks8LR4EJDVgIAIQEABDJKOeecgxBCCCFSijHnoIMQQgghREox5pyDEEIIIYSMMecghBBCCKGUkDHmHIQQQgghhFI65yCEUEoJpZRSSucchBBCCKWUUkoJIYQQQiillFJKKSGEEEoppZRSSiklhBBCKKWUUkoppYQQQiillFJKKaWUEEIopZRSSimllBJC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';
        var audioPlayer = new Audio(audiofile);
        _w.top.backNow = 0;
        audioPlayer.loop = true;
        _w.audioPlayer = audioPlayer;
        setInterval(function () {
            try {
                _w.jQuery.fn.viewer.Constructor.prototype.show = () => { };
            } catch (e) { }
        }, 1000);
        try {
            _w.unrivalScriptList.push('unrivalxxt');
        } catch (e) {
            _w.unrivalScriptList = ['unrivalxxt'];
        }
        function checkOffline() {
            let dleft = _d.getElementsByClassName('left');
            if (dleft.length == 1) {
                let img = dleft[0].getElementsByTagName('img');
                if (img.length == 1 && img[0].src.indexOf('loading.gif') != -1) {
                    return true;
                }
            }
            return false;
        }
        setInterval(function () {
            if (checkOffline()) {
                setTimeout(function () {
                    if (checkOffline()) {
                        _l.reload();
                    }
                }, 10000);
            }
        }, 3000);

        // 修复 visibilitychange 中的 timer 重复创建与泄漏问题
        let titleTimer = null;
        _d.addEventListener('visibilitychange', function () {
            var c = 0;
            if (titleTimer) {
                clearInterval(titleTimer);
                titleTimer = null;
            }
            if (_w.top.backNow == 0) {
                _d.title = '⚠️请先激活挂机';
                return;
            } else {
                _d.title = '学生学习页面';
            }
            if (_d.hidden) {
                audioPlayer.play();
                titleTimer = setInterval(function () {
                    if (c) {
                        _d.title = '🙈挂机中';
                        c = 0;
                    } else {
                        _d.title = '🙉挂机中';
                        c = 1;
                    }
                    if (!_d.hidden) {
                        clearInterval(titleTimer);
                        titleTimer = null;
                        _d.title = '学生学习页面';
                    }
                }, 1300);
            } else {
                audioPlayer.pause();
            }
        });

        _w.unrivalgetTeacherAjax = _w.getTeacherAjax;
        _w.getTeacherAjax = (courseid, classid, cid) => {
            if (cid == getQueryVariable('chapterId')) {
                return;
            }
            _w.top.unrivalPageRd = '';
            _w.unrivalgetTeacherAjax(courseid, classid, cid);
        };

        let curDisableMonitor = (_w.top && _w.top.unrivalDisableMonitor !== undefined) ? _w.top.unrivalDisableMonitor : parseInt(GM_getValue('unrivaldisablemonitor', '0'), 10);
        if (curDisableMonitor == 1) {
            _w.appendChild = _w.Element.prototype.appendChild;
            _w.Element.prototype.appendChild = function () {
                try {
                    if (arguments[0].src && arguments[0].src.indexOf('detect.chaoxing.com') > 0) {
                        return;
                    }
                } catch (e) { }
                _w.appendChild.apply(this, arguments);
            };
        }

        _w.jump = false;
        setInterval(function () {
            if (getQueryVariable('mooc2') == '1') {
                let tabs = _d.getElementsByClassName('posCatalog_select');
                for (let i = 0, l = tabs.length; i < l; i++) {
                    if (tabs[i].getAttribute('onclick') == null) {
                        tabs[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                            "','" + tabs[i].getAttribute('id').replace('cur', '') + "');");
                    }
                }
            } else {
                let h5s = _d.getElementsByClassName('ncells')[0].getElementsByTagName('h5');
                for (let i = 0, l = h5s.length; i < l; i++) {
                    if (h5s[i].getAttribute('onclick') == null) {
                        h5s[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                            "','" + h5s[i].getAttribute('id').replace('cur', '') + "');");
                    }
                }
            }
        }, 1000);

        setInterval(function () {
            let but = null;
            if (_w.jump) {
                _w.jump = false;
                _w.top.unrivalDoneWorkId = '';
                let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : parseInt(GM_getValue('unrivaljumptype', '1'), 10);
                _w.jjump = (rd) => {
                    if (rd != _w.top.unrivalPageRd) {
                        return;
                    }
                    try {
                        setTimeout(function () {
                            if (curJump == 1) { // 遍历模式
                                if (getQueryVariable('mooc2') == '1') {
                                    but = _d.getElementsByClassName('jb_btn jb_btn_92 fs14 prev_next next');
                                } else {
                                    but = _d.getElementsByClassName('orientationright');
                                }
                                try {
                                    setTimeout(function () {
                                        if (rd != _w.top.unrivalPageRd) {
                                            return;
                                        }
                                        if (but && but.length > 0) {
                                            but[0].click();
                                        }
                                    }, 2000);
                                } catch (e) { }
                                return;
                            }
                            if (getQueryVariable('mooc2') == '1') {
                                let ul = _d.getElementsByClassName('prev_ul')[0],
                                    lis = ul ? ul.getElementsByTagName('li') : [];
                                for (let i = 0, l = lis.length; i < l; i++) {
                                    if (lis[i].getAttribute('class') == 'active') {
                                        if (i + 1 >= l) {
                                            break;
                                        } else {
                                            try {
                                                lis[i + 1].click();
                                            } catch (e) { }
                                            return;
                                        }
                                    }
                                }
                                let tabs = _d.getElementsByClassName('posCatalog_select');
                                for (let i = 0, l = tabs.length; i < l; i++) {
                                    if (tabs[i].getAttribute('class') == 'posCatalog_select posCatalog_active') {
                                        while (i + 1 < tabs.length) {
                                            let nextTab = tabs[i + 1];
                                            if ((nextTab.innerHTML.includes('icon_Completed prevTips') && _w.top
                                                .unrivalReviewMode == '0') || nextTab.innerHTML.includes('catalog_points_er prevTips')) {
                                                i++;
                                                continue;
                                            }
                                            if (nextTab.id.indexOf('cur') < 0) {
                                                i++;
                                                continue;
                                            }
                                            let clickF = setInterval(function () {
                                                if (rd != _w.top.unrivalPageRd) {
                                                    clearInterval(clickF);
                                                    return;
                                                }
                                                nextTab.click();
                                            }, 2000);
                                            break;
                                        }
                                        break;
                                    }
                                }
                            } else {
                                let div = _d.getElementsByClassName('tabtags')[0],
                                    spans = div ? div.getElementsByTagName('span') : [];
                                for (let i = 0, l = spans.length; i < l; i++) {
                                    if (spans[i].getAttribute('class') && spans[i].getAttribute('class').indexOf('currents') >= 0) {
                                        if (i + 1 == l) {
                                            break;
                                        } else {
                                            try {
                                                spans[i + 1].click();
                                            } catch (e) { }
                                            return;
                                        }
                                    }
                                }
                                let tabs = _d.getElementsByTagName('span'),
                                    newTabs = [];
                                for (let i = 0, l = tabs.length; i < l; i++) {
                                    if (tabs[i].getAttribute('style') != null && tabs[i]
                                        .getAttribute('style').indexOf('cursor:pointer;height:18px;') >= 0) {
                                        newTabs.push(tabs[i]);
                                    }
                                }
                                tabs = newTabs;
                                for (let i = 0, l = tabs.length; i < l; i++) {
                                    if (tabs[i].parentNode && tabs[i].parentNode.getAttribute('class') == 'currents') {
                                        while (i + 1 < tabs.length) {
                                            let nextTab = tabs[i + 1].parentNode;
                                            if ((nextTab.innerHTML.includes('roundpoint  blue') && _w.top
                                                .unrivalReviewMode == '0') || nextTab.innerHTML.includes('roundpointStudent  lock')) {
                                                i++;
                                                continue;
                                            }
                                            if (nextTab.id.indexOf('cur') < 0) {
                                                i++;
                                                continue;
                                            }
                                            let clickF = setInterval(function () {
                                                if (rd != _w.top.unrivalPageRd) {
                                                    clearInterval(clickF);
                                                    return;
                                                }
                                                nextTab.click();
                                            }, 2000);
                                            break;
                                        }
                                        break;
                                    }
                                }
                            }
                        }, 2000);
                    } catch (e) { }
                };
                if (typeof _w.onReadComplete1 === 'function') {
                    _w.onReadComplete1();
                }
                // 修复将字符串代码改为标准函数回调
                setTimeout(() => _w.jjump(_w.top.unrivalPageRd), 2856);
            }
        }, 200);
    } else if (_l.href.indexOf("work/phone/doHomeWork") > 0) {
        var wIdE = _d.getElementById('workLibraryId') || _d.getElementById('oldWorkId'),
            wid = wIdE ? wIdE.value : '';
        _w.top.unrivalWorkDone = false;
        _w.aalert = _w.alert;
        _w.alert = (msg) => {
            if (msg == '保存成功') {
                _w.top.unrivalDoneWorkId = getQueryVariable('workId');
                return;
            }
            _w.aalert(msg);
        };
        if (_w.top.unrivalDoneWorkId == getQueryVariable('workId')) {
            _w.top.unrivalWorkDone = true;
            return;
        }
        _w.confirm = (msg) => true;

        var questionList = [],
            questionsElement = _d.getElementsByClassName('Py-mian1'),
            questionNum = questionsElement.length,
            totalQuestionNum = questionNum; // 记录总题目数

        for (let i = 0; i < questionsElement.length; i++) {
            let questionElement = questionsElement[i],
                idElements = questionElement.getElementsByTagName('input'),
                questionId = '0',
                titleElement = questionElement.getElementsByClassName('Py-m1-title fs16')[0];
            if (!titleElement) continue;

            let question = titleElement.innerHTML;
            question = handleImgs(question).replace(/(<([^>]+)>)/ig, '').replace(/[0-9]{1,3}\.\[(.*?)\]/ig, '').replaceAll('\n',
                '').replace(/^\s+/ig, '').replace(/\s+$/ig, '');

            for (let z = 0, k = idElements.length; z < k; z++) {
                try {
                    let nameAttr = idElements[z].getAttribute('name');
                    if (nameAttr && nameAttr.indexOf('answer') >= 0) {
                        questionId = nameAttr.replace('type', '');
                        break;
                    }
                } catch (e) {
                    console.log(e);
                    continue;
                }
            }
            if (questionId == '0' || question == '') {
                continue;
            }
            let typeE = questionElement.getElementsByTagName('input');
            if (typeE == null || typeE.length === 0) {
                continue;
            }
            let typeN = 'unknown';
            for (let g = 0, h = typeE.length; g < h; g++) {
                if (typeE[g].id == 'answertype' + questionId.replace('answer', '').replace('check', '')) {
                    typeN = typeE[g].value;
                    break;
                }
            }
            // 支持 0:单选, 1:多选, 2:填空, 3:判断
            if (['0', '1', '2', '3'].indexOf(typeN) < 0) {
                if (_w.top && _w.top.unrivalWorkInfo !== undefined) {
                    _w.top.unrivalWorkInfo = '遇到暂不支持的题型(题型代码:' + typeN + ')，已跳过';
                }
                continue;
            }
            let type = {
                '0': '单选题',
                '1': '多选题',
                '2': '填空题',
                '3': '判断题'
            }[typeN];

            let optionList = {
                length: 0
            };
            if (['单选题', '多选题'].indexOf(type) >= 0) {
                let answerListContainer = questionElement.getElementsByClassName('answerList')[0];
                if (answerListContainer) {
                    let answersElements = answerListContainer.getElementsByTagName('li');
                    for (let x = 0, j = answersElements.length; x < j; x++) {
                        let optionE = answersElements[x],
                            optionTextE = trim(optionE.innerHTML.replace(/(^\s*)|(\s*$)/g, "")),
                            optionText = optionTextE.slice(1).replace(/(^\s*)|(\s*$)/g, ""),
                            optionValue = optionTextE.slice(0, 1),
                            optionId = optionE.getAttribute('id-param');
                        if (optionText == '') {
                            break;
                        }
                        optionList[optionText] = {
                            'id': optionId,
                            'value': optionValue
                        };
                        optionList.length++;
                    }
                    if (answersElements.length != optionList.length) {
                        continue;
                    }
                }
            }
            questionList.push({
                'index': i,
                'question': question,
                'type': type,
                'typeCode': typeN,
                'questionid': questionId,
                'options': optionList
            });
        }

        // 统一查询降级链路：主题库 -> 备用题库 -> AI 大模型
        function searchQuestionAnswer(quItem, callback) {
            let curToken = GM_getValue('tikutoken', '') || '';

            // 1. 尝试自定义备用题库
            function tryCustomBank() {
                let customEnable = GM_getValue('customTikuEnable', '0') === '1';
                let customUrl = (GM_getValue('customTikuUrl', '') || '').trim();
                let customToken = (GM_getValue('customTikuToken', '') || '').trim();
                if (!customEnable || !customUrl) {
                    tryAiBank();
                    return;
                }
                let headers = {
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
                if (customToken) {
                    headers['Authorization'] = customToken;
                }
                let param = 'question=' + encodeURIComponent(quItem['question']) +
                    '&type=' + quItem['typeCode'] + '&id=' + wid;
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: customUrl,
                    headers: headers,
                    data: param,
                    timeout: 5000,
                    onload: function (res) {
                        let ans = parseAnswerResponse(res);
                        if (ans) {
                            callback({ code: 1, data: ans, from: '备用题库' });
                        } else {
                            tryAiBank();
                        }
                    },
                    onerror: function () {
                        tryAiBank();
                    },
                    ontimeout: function () {
                        tryAiBank();
                    }
                });
            }

            // 2. 尝试 DeepSeek AI 大模型题库
            function tryAiBank() {
                let aiEnable = GM_getValue('aiTikuEnable', '0') === '1';
                let aiApiKey = (GM_getValue('aiTikuApiKey', '') || '').trim();
                let aiModel = (GM_getValue('aiTikuModel', 'deepseek-flash') || '').trim();
                if (!['deepseek-flash', 'deepseek-v4-pro'].includes(aiModel)) {
                    aiModel = 'deepseek-flash';
                    GM_setValue('aiTikuModel', 'deepseek-flash');
                }
                let aiEffort = GM_getValue('aiTikuEffort', 'low') || 'low';
                if (!['low', 'none', 'high', 'max'].includes(aiEffort)) {
                    aiEffort = 'low';
                }

                if (!aiEnable || !aiApiKey) {
                    callback({ code: -1, data: '未找到答案' });
                    return;
                }

                let optionsStr = '';
                if (quItem['options'] && quItem['options'].length > 0) {
                    let optArr = [];
                    for (let optText in quItem['options']) {
                        if (optText === 'length') continue;
                        optArr.push(quItem['options'][optText].value + '. ' + optText);
                    }
                    optArr.sort();
                    optionsStr = optArr.join('\n');
                }
                let promptText = '【题型】' + quItem['type'] + '\n【题目】' + quItem['question'] + '\n';
                if (optionsStr) {
                    promptText += '【选项】\n' + optionsStr + '\n';
                }
                promptText += '请直接给出本题最终正确答案，严禁输出任何分析过程、解释、推导或多余字符。\n' +
                    '- 单选题：仅输出对应选项字母（如 A）或文本；\n' +
                    '- 多选题：仅输出所有正确选项字母组合（如 ACD）或文本；\n' +
                    '- 判断题：仅输出“正确”或“错误”；\n' +
                    '- 填空题：仅输出填空内容。';

                let reqBody = {
                    model: aiModel,
                    messages: [
                        { role: 'system', content: '你是高校专业章节测试答题机器人，仅输出最简答案文本，不要任何废话。' },
                        { role: 'user', content: promptText }
                    ],
                    stream: false,
                    reasoning_effort: aiEffort,
                    thinking: {
                        type: aiEffort === 'none' ? 'disabled' : 'enabled'
                    }
                };

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://api.deepseek.com/chat/completions',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + aiApiKey
                    },
                    data: JSON.stringify(reqBody),
                    timeout: 25000,
                    onload: function (res) {
                        try {
                            let json = JSON.parse(res.responseText);
                            let content = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
                            if (content) {
                                content = content.trim().replace(/^\`\`\`[a-z]*\s*/i, '').replace(/\`\`\`$/i, '').trim();
                                content = content.replace(/^(答|答案|标准答案)[:：]\s*/i, '').trim();
                                callback({ code: 1, data: content, from: 'DeepSeek (' + aiModel + ')' });
                                return;
                            }
                        } catch (e) { }
                        callback({ code: -1, data: '未找到答案' });
                    },
                    onerror: function () {
                        callback({ code: -1, data: '未找到答案' });
                    },
                    ontimeout: function () {
                        callback({ code: -1, data: '未找到答案' });
                    }
                });
            }

            // 优先查询一之哥哥主题库
            let param = 'question=' + encodeURIComponent(quItem['question']) +
                '&type=' + quItem['typeCode'] + '&id=' + wid;
            GM_xmlhttpRequest({
                method: "POST",
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded',
                    'Authorization': curToken,
                },
                url: ctUrl,
                timeout: 4000,
                data: param,
                onload: function (res) {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(res.responseText);
                    } catch (e) { }
                    if (parsed && parsed.code === 1 && parsed.data) {
                        callback(parsed);
                    } else {
                        tryCustomBank();
                    }
                },
                onerror: function () {
                    tryCustomBank();
                },
                ontimeout: function () {
                    tryCustomBank();
                }
            });
        }

        function parseAnswerResponse(res) {
            if (!res || !res.responseText) return null;
            try {
                let json = JSON.parse(res.responseText);
                if (json.code === 1 || json.code === 200 || json.code === 0 || json.status === true || json.status === 1) {
                    if (json.data !== undefined && json.data !== null && json.data !== '') {
                        if (typeof json.data === 'string') return json.data;
                        if (json.data.answer) return json.data.answer;
                        return json.data;
                    }
                    if (json.answer) return json.answer;
                }
                if (json.data && typeof json.data === 'string') return json.data;
                if (json.answer) return json.answer;
            } catch (e) {
                if (res.status === 200 && res.responseText.length > 0 && res.responseText.length < 500 && !res.responseText.includes('<html')) {
                    return res.responseText.trim();
                }
            }
            return null;
        }

        var nowTime = -4000,
            busyThread = questionList.length,
            curRandomDo = (_w.top && _w.top.unrivalRandomDo !== undefined) ? _w.top.unrivalRandomDo : parseInt(GM_getValue('unrivalrandomdo', '1'), 10),
            curAccuracy = GM_getValue('accuracy', 60),
            ctOnload = function (res, quu) {
                busyThread -= 1;
                var ctResult = res || {
                    'code': -1,
                    'data': '未找到答案'
                };
                try {
                    let choiceEs = _d.getElementsByTagName('li');
                    let cleanQId = quu['questionid'].replace('answer', '');

                    if (ctResult['code'] != 1) {
                        _w.top.unrivalWorkInfo = '题目：' + quu['question'] + '：未搜索到答案';

                        // 未命中答案时的盲猜机制（当允许盲猜且合格正确率不为100%时）
                        if (curRandomDo == 1 && curAccuracy < 100) {
                            if (quu['type'] == '判断题') {
                                _w.top.unrivalWorkInfo = quu['question'] + '：未找到答案，自动选【错】';
                                for (let u = 0, k = choiceEs.length; u < k; u++) {
                                    if (choiceEs[u].getElementsByTagName('em').length < 1) continue;
                                    if (choiceEs[u].getAttribute('val-param') == 'false' &&
                                        choiceEs[u].getAttribute('id-param') == cleanQId) {
                                        choiceEs[u].click();
                                        return;
                                    }
                                }
                            } else if (quu['type'] == '单选题') {
                                _w.top.unrivalWorkInfo = quu['question'] + '：未找到答案，自动选【B】';
                                for (let y = 0, j = choiceEs.length; y < j; y++) {
                                    let em = choiceEs[y].getElementsByTagName('em');
                                    if (em.length < 1) continue;
                                    let emLetter = (em[0].getAttribute('id-param') || em[0].innerText || '').trim();
                                    if (emLetter == 'B' && choiceEs[y].getAttribute('id-param') == cleanQId) {
                                        if (!choiceEs[y].getAttribute('class').includes('cur')) {
                                            choiceEs[y].click();
                                        }
                                        return;
                                    }
                                }
                            } else if (quu['type'] == '多选题') {
                                _w.top.unrivalWorkInfo = quu['question'] + '：未找到答案，自动全选';
                                for (let y = 0, j = choiceEs.length; y < j; y++) {
                                    if (choiceEs[y].getElementsByTagName('em').length < 1) continue;
                                    if (choiceEs[y].getAttribute('id-param') == cleanQId) {
                                        if (!choiceEs[y].getAttribute('class').includes('cur')) {
                                            choiceEs[y].click();
                                        }
                                    }
                                }
                            }
                        }
                        return;
                    }

                    var result = ctResult['data'];
                    _w.top.unrivalWorkInfo = (ctResult['from'] ? '[' + ctResult['from'] + '] ' : '') + '题目：' + quu['question'] + '：' + (typeof result === 'object' ? JSON.stringify(result) : result);

                    switch (quu['type']) {
                        case '判断题':
                            (function () {
                                let resStr = String(result).trim();
                                let answer = '';
                                if (/[对√正确是truet1]/i.test(resStr) && !/[错×错误否falsef0]/i.test(resStr)) {
                                    answer = 'true';
                                } else if (/[错×错误否falsef0]/i.test(resStr)) {
                                    answer = 'false';
                                } else if ('正确是对√Tri'.indexOf(resStr) >= 0) {
                                    answer = 'true';
                                } else if ('错误否错×Fwr'.indexOf(resStr) >= 0) {
                                    answer = 'false';
                                }

                                if (answer) {
                                    for (let u = 0, k = choiceEs.length; u < k; u++) {
                                        if (choiceEs[u].getAttribute('val-param') == answer &&
                                            choiceEs[u].getAttribute('id-param') == cleanQId) {
                                            choiceEs[u].click();
                                            questionNum -= 1;
                                            return;
                                        }
                                    }
                                }
                                if (curRandomDo == 1 && curAccuracy < 100) {
                                    _w.top.unrivalWorkInfo = quu['question'] + '：未匹配到判断结果，自动选【错】';
                                    for (let u = 0, k = choiceEs.length; u < k; u++) {
                                        if (choiceEs[u].getElementsByTagName('em').length < 1) continue;
                                        if (choiceEs[u].getAttribute('val-param') == 'false' &&
                                            choiceEs[u].getAttribute('id-param') == cleanQId) {
                                            choiceEs[u].click();
                                            return;
                                        }
                                    }
                                }
                            })();
                            break;

                        case '单选题':
                            (function () {
                                function clickOptionByLetter(letter) {
                                    for (let y = 0, j = choiceEs.length; y < j; y++) {
                                        let em = choiceEs[y].getElementsByTagName('em');
                                        if (em.length < 1) continue;
                                        let emLetter = (em[0].getAttribute('id-param') || em[0].innerText || '').trim();
                                        if (emLetter.toUpperCase() == letter.toUpperCase() && choiceEs[y].getAttribute('id-param') == cleanQId) {
                                            if (!choiceEs[y].getAttribute('class').includes('cur')) {
                                                choiceEs[y].click();
                                            }
                                            return true;
                                        }
                                    }
                                    return false;
                                }

                                let cleanRes = String(result).trim();
                                // 1. 优先尝试选项字母匹配（如 "A", "A.", "选项A", "A、"）
                                let letterMatch = cleanRes.match(/^(?:选项)?\s*([A-Za-z])(?:\.|\、|\s|$)/i);
                                if (letterMatch) {
                                    let targetLetter = letterMatch[1].toUpperCase();
                                    if (clickOptionByLetter(targetLetter)) {
                                        questionNum -= 1;
                                        return;
                                    }
                                }

                                // 2. 文本匹配（清洗空白符和HTML特殊字符）
                                let cleanResText = cleanText(cleanRes);
                                for (let option in quu['options']) {
                                    if (option === 'length') continue;
                                    let cleanOpt = cleanText(option);
                                    if (cleanOpt && cleanResText && (cleanOpt == cleanResText || cleanOpt.includes(cleanResText) || cleanResText.includes(cleanOpt))) {
                                        if (clickOptionByLetter(quu['options'][option]['value'])) {
                                            questionNum -= 1;
                                            return;
                                        }
                                    }
                                }

                                // 3. 盲猜
                                if (curRandomDo == 1 && curAccuracy < 100) {
                                    _w.top.unrivalWorkInfo = quu['question'] + '：未匹配到正确答案，自动选【B】';
                                    clickOptionByLetter('B');
                                }
                            })();
                            break;

                        case '多选题':
                            (function () {
                                function clickOptionByLetter(letter) {
                                    for (let y = 0, j = choiceEs.length; y < j; y++) {
                                        let em = choiceEs[y].getElementsByTagName('em');
                                        if (em.length < 1) continue;
                                        let emLetter = (em[0].getAttribute('id-param') || em[0].innerText || '').trim();
                                        if (emLetter.toUpperCase() == letter.toUpperCase() && choiceEs[y].getAttribute('id-param') == cleanQId) {
                                            if (!choiceEs[y].getAttribute('class').includes('cur')) {
                                                choiceEs[y].click();
                                            }
                                            return true;
                                        }
                                    }
                                    return false;
                                }

                                let hasAnswer = false;
                                // 1. 若返回为数组形式，提取选项字母
                                if (Array.isArray(result)) {
                                    let letters = result.map(s => String(s).trim().toUpperCase()).filter(s => /^[A-Z]$/.test(s));
                                    if (letters.length > 0) {
                                        letters.forEach(ltr => {
                                            if (clickOptionByLetter(ltr)) hasAnswer = true;
                                        });
                                    }
                                } else if (typeof result === 'string') {
                                    let s = result.trim();
                                    // 2. 判断是否纯为选项字母组合（如 "ACD", "A,C,D", "A#C#D", "A C D"）
                                    if (/^[A-Za-z\s,#、|&;]+$/.test(s)) {
                                        let letters = s.toUpperCase().match(/[A-Z]/g);
                                        if (letters && letters.length > 0) {
                                            letters.forEach(ltr => {
                                                if (clickOptionByLetter(ltr)) hasAnswer = true;
                                            });
                                        }
                                    }
                                }

                                // 3. 文本包含匹配
                                if (!hasAnswer) {
                                    let answerData = cleanText(String(result));
                                    for (let option in quu['options']) {
                                        if (option === 'length') continue;
                                        let optTextClean = cleanText(option);
                                        if (optTextClean && answerData && (answerData.includes(optTextClean) || optTextClean.includes(answerData))) {
                                            if (clickOptionByLetter(quu['options'][option]['value'])) {
                                                hasAnswer = true;
                                            }
                                        }
                                    }
                                }

                                if (hasAnswer) {
                                    questionNum -= 1;
                                } else if (curRandomDo == 1 && curAccuracy < 100) {
                                    _w.top.unrivalWorkInfo = quu['question'] + '：未匹配到正确答案，自动全选';
                                    for (let option in quu['options']) {
                                        if (option === 'length') continue;
                                        clickOptionByLetter(quu['options'][option]['value']);
                                    }
                                }
                            })();
                            break;

                        case '填空题':
                            (function () {
                                let qEl = questionsElement[quu['index']];
                                if (!qEl) {
                                    qEl = _d.getElementById('question' + cleanQId) || questionsElement[0];
                                }
                                let inputEs = qEl ? qEl.querySelectorAll('textarea, input[type="text"]') : [];
                                if (!inputEs || inputEs.length === 0) {
                                    inputEs = qEl ? qEl.getElementsByTagName('textarea') : [];
                                }
                                if (!inputEs || inputEs.length === 0) {
                                    inputEs = qEl ? Array.from(qEl.getElementsByTagName('input')).filter(el => {
                                        let t = (el.getAttribute('type') || 'text').toLowerCase();
                                        return t === 'text' || t === '';
                                    }) : [];
                                }
                                if (inputEs && inputEs.length > 0) {
                                    let answers = [];
                                    if (Array.isArray(result)) {
                                        answers = result;
                                    } else if (typeof result === 'string') {
                                        if (result.includes('===')) answers = result.split('===');
                                        else if (result.includes('#')) answers = result.split('#');
                                        else if (result.includes('|')) answers = result.split('|');
                                        else if (result.includes('\n')) answers = result.split('\n');
                                        else answers = [result];
                                    } else {
                                        answers = [String(result)];
                                    }
                                    let filledCount = 0;
                                    for (let b = 0; b < inputEs.length; b++) {
                                        let ans = (answers[b] !== undefined ? answers[b] : answers[0]) || '';
                                        ans = trim(ans).replace(/^(答案[:：]|\d+[\.、])/g, '').trim();
                                        inputEs[b].value = ans;
                                        inputEs[b].dispatchEvent(new Event('input', { bubbles: true }));
                                        inputEs[b].dispatchEvent(new Event('change', { bubbles: true }));
                                        filledCount++;
                                    }
                                    if (filledCount > 0) {
                                        questionNum -= 1;
                                    }
                                }
                            })();
                            break;
                    }
                } catch (e) {
                    console.log(e);
                }
            };

        // 修复闭包变量覆盖 Bug：在每次循环内部使用独立的局部 const qu
        for (let i = 0, l = questionList.length; i < l; i++) {
            nowTime += parseInt(Math.random() * 2000 + 2500, 10);
            setTimeout(function () {
                const qu = questionList[i];
                searchQuestionAnswer(qu, function (resultData) {
                    ctOnload(resultData, qu);
                });
            }, nowTime);
        }

        var workInterval = setInterval(function () {
            if (busyThread > 0) {
                return;
            }
            clearInterval(workInterval);

            // 修复正确率计算公式与 NaN 卡死 Bug
            let currentAccuracy = totalQuestionNum > 0 ? Math.floor(((totalQuestionNum - questionNum) / totalQuestionNum) * 100) : 100;

            if (currentAccuracy >= curAccuracy && _w.top.unrivalAutoSubmit == '1') {
                _w.top.unrivalDoneWorkId = getQueryVariable('workId');
                _w.top.unrivalWorkInfo = '正确率符合标准 (' + currentAccuracy + '% >= ' + curAccuracy + '%)，已提交测试';
                setTimeout(function () {
                    if (typeof submitCheckTimes === 'function') submitCheckTimes();
                    if (typeof escapeBlank === 'function') escapeBlank();
                    if (typeof submitAction === 'function') submitAction();
                }, parseInt(Math.random() * 2000 + 3000, 10));
            } else if (_w.top.unrivalAutoSave == '1') {
                _w.top.unrivalWorkInfo = '正确率(' + currentAccuracy + '%)未达提交标准或未开启自动提交，已自动保存答案';
                setTimeout(function () {
                    _w.top.unrivalDoneWorkId = getQueryVariable('workId');
                    if (typeof _w.noSubmit === 'function') {
                        _w.noSubmit();
                    }
                }, 2000);
            } else {
                _w.top.unrivalWorkInfo = '当前正确率：' + currentAccuracy + '%，用户设置为不自动保存，请手动处理作业';
            }
        }, 1000);
    } else if (_l.href.includes('work/phone/selectWorkQuestionYiPiYue')) {
        _w.top.unrivalWorkDone = true;
        _w.top.unrivalDoneWorkId = getQueryVariable('workId');
    } else if (_l.href.includes('stat2-ans.chaoxing.com/task/s/index')) {
        if (_w.top == _w) {
            return;
        }
        let pageC = _d.getElementsByClassName('page-container studentStatistic')[0];
        if (pageC) pageC.setAttribute('class', 'studentStatistic');
        let taskL = _d.getElementsByClassName('page-item item-task-list minHeight390')[0];
        if (taskL) taskL.remove();
        let subN = _d.getElementsByClassName('subNav clearfix')[0];
        if (subN) subN.remove();
        setInterval(function () {
            _l.reload();
        }, 90000);
    } else if (_l.href.includes('passport2.') && _l.href.includes('login?refer=http') && autoLogin == 1) {
        if (!(/^1[3456789]\d{9}$/.test(phoneNumber))) {
            alert('自动登录的手机号填写错误，无法登陆');
            return;
        }
        if (password == '') {
            alert('未填写登录密码，无法登陆');
            return;
        }
        GM_xmlhttpRequest({
            method: "get",
            url: 'https://passport2-api.chaoxing.com/v11/loginregister?cx_xxt_passport=json&uname=' +
                phoneNumber + '&code=' + encodeURIComponent(password),
            onload: function (res) {
                try {
                    let ispass = JSON.parse(res.responseText);
                    if (ispass['status']) {
                        _l.href = decodeURIComponent(getQueryVariable('refer'));
                    } else {
                        alert(ispass['mes']);
                    }
                } catch (err) {
                    console.log(res.responseText);
                    alert('登陆失败');
                }
            },
            onerror: function (err) {
                alert('登陆错误');
            }
        });
    } else if (_l.href.includes('unrivalxxtbackground')) {
        _d.getElementsByTagName("html")[0].innerHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>学习通挂机小助手</title>
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
        <link href="https://z.chaoxing.com/yanshi/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="row" style="margin: 10px;">
            <div class="col-md-6 col-md-offset-3">
                <div class="header clearfix">
                    <h3 class="text-muted" style="margin-top: 20px;margin-bottom: 0;float: left;">学习通挂机小助手</h3>
                </div>
                <hr style="margin-top: 10px;margin-bottom: 20px;">
                <div class="panel panel-info">
                    <div class="panel-heading">任务列表</div>
                    <div class="panel-body" id='joblist'></div>
                </div>
                <div class="panel panel-info">
                    <div class="panel-heading">运行日志</div>
                    <div class="panel-body">
                        <div id="result" style="overflow:auto;line-height: 30px;">
                            <div id="log"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
`;
        var bgLogs = {
            "logArry": [],
            "addLog": function (str, color = "black") {
                if (this.logArry.length >= 50) {
                    this.logArry.splice(0, 1);
                }
                var nowTime = new Date(),
                    nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2),
                    nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2),
                    nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2),
                    logElement = _d.getElementById('log'),
                    logStr = "";
                this.logArry.push("<span style='color: " + color + "'>[" + nowHour + ":" + nowMin + ":" +
                    nowSec + "] " + str + "</span>");
                for (let logI = 0, logLen = this.logArry.length; logI < logLen; logI++) {
                    logStr += this.logArry[logI] + "<br>";
                }
                if (logElement) {
                    logElement.innerHTML = logStr;
                    logElement.scrollTop = logElement.scrollHeight;
                }
            }
        };
        bgLogs.addLog('此页面不必保持在最前端，后台会自动进行任务', 'green');
        setInterval(function () {
            bgLogs.addLog('此页面不必保持在最前端，后台会自动进行任务', 'green');
            bgLogs.addLog('如想禁用后台刷视频功能，请关闭脚本并重启浏览器', 'blue');
        }, 120000);

        GM_addValueChangeListener('unrivalxxtbackgroundinfo', function (name, old_value, new_value, remote) {
            if (old_value != new_value) {
                bgLogs.addLog(new_value);
            }
        });

        setInterval(function () {
            if (Math.round(new Date() / 1000) - parseInt(GM_getValue('unrivalBackgroundVideoEnable', '6')) > 15) {
                bgLogs.addLog('超星挂机小助手可能运行异常，如页面无反应，请尝试重启脚本猫或重启浏览器');
            }
        }, 10000);

        var loopShow = () => {
            let jobList = GM_getValue('unrivalBackgroundList', '1');
            let jobListEl = _d.getElementById('joblist');
            if (!jobListEl) return;
            if (jobList == '1') {
                jobListEl.innerHTML = '请将“超星挂机小助手”升级到最新版并重启浏览器';
            } else {
                try {
                    let jobHtml = '';
                    for (let i = 0, l = jobList.length; i < l; i++) {
                        let status = '';
                        if (jobList[i]['done']) {
                            status = '已完成';
                        } else if (parseInt(jobList[i]['playTime']) > 0) {
                            status = '进行中';
                        } else {
                            status = '等待中';
                        }
                        if (jobList[i]['review']) {
                            status += '：复习模式';
                        }
                        jobHtml += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    [${status}] ${jobList[i]['name']}
                                </div>
                            </div>`;
                    }
                    jobListEl.innerHTML = jobHtml;
                } catch (e) {
                    jobListEl.innerHTML = '请将“超星挂机小助手”升级到最新版并重启浏览器！';
                }
            }
        };
        loopShow();
        setInterval(loopShow, 10000);
    }
})();
