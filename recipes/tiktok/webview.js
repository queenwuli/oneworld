const _path = _interopRequireDefault(require('path'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

module.exports = (Ferdium, settings) => {
  const oneworld = {
    token: '',
    settingCfg: {
      tranflag: true,
      groupflag: false,
      sendtranslation: true,
      type: 1,
      fontsize: 12,
      fontcolor: '#000000',
      from: 'zh-CHS',
      to: 'en',
    },
  };

  oneworld = settings.userData;

  console.log("ready to translation", settings);

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data)
  })


  const classnameCfg = {
    ipt: '.public-DraftStyleDefault-block',
    sendBtn: '.tiktok-d7yhdo-StyledSendButton',
    main: '.tiktok-1ckpdrf-DivChatBox',
    allMsg: '.tiktok-1rdxtjl-PText',
    friendList: '.etdtmal5',
    iptSpan:
      ".DraftEditor-editorContainer .public-DraftEditor-content span[data-text='true']",
  }

  const getMessages = () => {
    const selNotifications = document.querySelector(
      'div.tiktok-1b4xcc5-DivHeaderInboxContainer.e18kkhh40 > sup'
    );
    const selDM = document.querySelector(
      'div.tiktok-1ibfxbr-DivMessageIconContainer.e1nx07zo0 > sup'
    );

    const countNotifications =
      selNotifications != null
        ? Ferdium.safeParseInt(selNotifications.outerText)
        : 0;
    const countDM = selDM != null ? Ferdium.safeParseInt(selDM.outerText) : 0;

    const count = countNotifications + countDM;

    Ferdium.setBadge(count);
  };
  Ferdium.loop(getMessages);

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));

  Ferdium.initLocalData();
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    setTimeout(() => {
      let mainLoop = setInterval(() => {
        let view = getMainView();
        if (view) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);

      setTimeForFunc(listerFriendList, 500);
    }, 1500);
  });

  const listerFriendList = () => {
    document.addEventListener(
      'click',
      (e) => {
        setTimeForFunc(() => {
          addClickLister(e);
        }, 1000);
      },
      true
    );
  };

  const addClickLister = (e) => {
    let target = e.target;
    if (checkClickInFrendList(target)) setTimeForFunc(addFreshEvent, 500);
  };

  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  const freshChatList = () => {
    let msgList = document.querySelectorAll(classnameCfg.allMsg);
    for (const msgDiv of msgList) {
      if (
        msgDiv.parentNode.querySelectorAll('.autofanyi').length > 0 ||
        msgDiv.parentNode.querySelectorAll('.autofanyi') > 0
      )
        continue;
      let msg = msgDiv.innerText;
      if (!msg || isNumber(msg)) continue;
      if (
        !oneworld.settingCfg.tranflag ||
        (isGroup() && !oneworld.settingCfg.groupflag)
      ) {
        if (checkFanyiChild(msgDiv)) {
          insterDiv(msgDiv, 'click-fanyi', '点击翻译');

          msgDiv.parentNode
            .querySelectorAll('.click-fanyi')[0]
            .addEventListener('click', clickFanyi);
        }
      } else {
        if (checkFanyiChild(msgDiv)) {
          insterDiv(msgDiv, 'autofanyi', '...');
          autoFanyi(msg, msgDiv);
        }
      }
    }
  };

  const checkFanyiChild = (msgDiv) => {
    return !msgDiv.parentNode.querySelector('.click-fanyi') && !msgDiv.parentNode.querySelector('.autofanyi')
  }

  const clickFanyi = async (e) => {
    let div = getEventTarget(e);
    let msg = div.parentNode.querySelector('.tiktok-1rdxtjl-PText').innerText;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.querySelector('click-fanyi').innerText = res.body.data;
    div.removeEventListener('click', clickFanyi);
  };

  const autoFanyi = async (msg, msgDiv) => {
    let autoFanyi = msgDiv.parentNode.querySelector(".autofanyi");
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi')
    if (clickfanyi) clickfanyi.style.display = 'none';
    if (!oneworld.settingCfg.tranflag && autoFanyi) autoFanyi.innerText = '';
    if (!isNumber(msg)) {
      let params = getResData(msg, false);
      let res = await Ferdium.getTran(params, oneworld.token)
      if (!res.err && res.body.code == 200) {
        //显示翻译内容
        autoFanyi.innerHTML =
          '';
        autoFanyi.innerHTML =
          res.body.data;
      } else if (res.body.code == 500) {
        autoFanyi.innerHTML = '您的余额已不足';
      } else
        autoFanyi.innerHTML = '翻译失败';
    } else {
      autoFanyi.style.display = 'none';
    }
  };

  const getMainView = () => {
    let view = document.querySelector(classnameCfg.main);
    return view;
  };

  const checkClickInFrendList = (target) => {
    let view1 = document.querySelector(classnameCfg.friendList);
    if (view1 && view1.contains(target)) return true;
    return false;
  };

  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      (event) => {
        let key = event.key;
        if (!oneworld.settingCfg.sendtranslation) return;
        if (key == 'Enter') {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          let ipt = document.querySelector(classnameCfg.ipt);
          handleSendMessage(ipt, msg, true);
        }

        /**阻断事件 */
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      },
      true
    );
  };

  const getIptSendMsg = () => {
    let ipt = document.querySelector(classnameCfg.ipt);
    let text = ipt.childNodes[0].innerHTML;
    return text;
  };

  /**
   * 发送消息
   * !本输入框使用的是textarea  修改innerHtml innerText均无效
   */
  const handleSendMessage = async (document, context) => {
    let params = getResData(context, true);
    let res = await Ferdium.getTran(params, oneworld.token, true)
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }

    let result
    if (res.body.code == 500) {
      result = '字符余额不足，请充值';
      document.querySelector(classnameCfg.iptSpan).innerHTML = result;
    }
    if (res.body.code === 200 && res.body.data) {
      result = res.body.data;
      result = result.replace(/</gi, '&lt;'); // 过滤所有的<
      result = result.replace(/>/gi, '&gt;'); // 过滤所有的>

      document.querySelector(classnameCfg.iptSpan).innerHTML = result;
      mdInputFoucsLastIndex(document);
      let HTMLEvents = window.document['createEvent']('HTMLEvents');
      HTMLEvents['initEvent']('input', true, true);
      document.dispatchEvent(HTMLEvents);

      // 点击发送
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
  };

  const clickSendBtn = () => {
    let sendBtn = document.querySelector(classnameCfg.sendBtn);
    let evtClick = window.document.createEvent('MouseEvents');
    evtClick.initEvent('click', true, true);
    sendBtn.dispatchEvent(evtClick);
  };

  const insterDiv = (parent, className, msg) => {
    if (!parent || !parent.insertAdjacentHTML) return;
    parent.insertAdjacentHTML(
      'afterEnd',
      "<div class='" +
      className +
      "' style='font-size:  " +
      oneworld.settingCfg.fontsize +
      'px;color:  ' +
      oneworld.settingCfg.fontcolor +
      ";margin-right:55px;'>" +
      msg +
      '</div>'
    );
  };

  const getEventTarget = (e) => {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  const isNumber = (str) => {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return patrn.exec(str) == null || str == '' ? false : true;
  };
  // 掩饰
  const setTimeForFunc = (func, time) => {
    setTimeout(func, time);
  };
  const isGroup = () => {
    return false;
  };

  const getResData = (msgText, isAuto) => {
    let params = {
      word: msgText,
      from: isAuto ? oneworld.settingCfg.sfrom : oneworld.settingCfg.sto,
      to: isAuto ? oneworld.settingCfg.sto : oneworld.settingCfg.sfrom,
      type: oneworld.settingCfg.type,
    };
    return params;
  };

  const replaceAllHtml = (data) => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.replace(/\s+/g, '\n'); // 过滤所有的空格
    return data;
  };

  const mdInputFoucsLastIndex = (obj) => {
    if (window.getSelection) {
      //ie11 10 9 ff safari
      obj.focus(); //解决ff不获取焦点无法定位问题
      var range = window.getSelection(); //创建range
      range.selectAllChildren(obj); //range 选择obj下所有子内容
      range.collapseToEnd(); //光标移至最后
    } else if (document.selection) {
      //ie10 9 8 7 6 5
      var range = document.selection.createRange(); //创建选择对象
      //var range = document.body.createTextRange();
      range.moveToElementText(obj); //range定位到obj
      range.collapse(false); //光标移至最后
      range.select();
    }
  };

  const updateSettingData = (data) => {
    oneworld.settingCfg.tranflag = data.tranflag
    oneworld.settingCfg.groupflag = data.groupflag
    oneworld.settingCfg.type = data.type
    oneworld.settingCfg.fontsize = data.fontsize
    oneworld.settingCfg.fontcolor = data.fontcolor
    oneworld.settingCfg.sfrom = data.sfrom
    oneworld.settingCfg.sto = data.sto
    oneworld.settingCfg.sendtranslation = data.sendtranslation;
  }
};
