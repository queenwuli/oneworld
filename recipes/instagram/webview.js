const _path = _interopRequireDefault(require('path'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

module.exports = (Ferdium, settings) => {
  let oneworld = {
    token: settings.userData.token,
    settingCfg: {
      ...settings.userData.settingCfg,
      sfrom: settings.sfrom,
      sto: settings.sto,
      jfrom: settings.jfrom,
      jto: settings.jto,
    },
  };

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classnameCfg.sendBtn)?.click();
    }, 500);
  });

  const classnameCfg = {
    ipt: '._ab5w ._acrb .xeuugli textarea',
    main: '._aa5b',
    allMsg: '._aacl._aaco._aacu._aacx._aad9._aadf',
    friendList: '._abyk',
    sendBtn: '._acrb .x2lah0s .xjqpnuy',
    groupflagEl: '._aa4k _aa4l .x1gslohp ._acan _acao _acas _aj1- ._aa2r'
  };

  const getMessages = () => {
    const element = document.querySelector('a[href^="/direct/inbox"]');
    Ferdium.setBadge(element ? Ferdium.safeParseInt(element.textContent) : 0);
  };

  Ferdium.loop(getMessages);

  // https://github.com/ferdium/ferdium-recipes/blob/9d715597a600710c20f75412d3dcd8cdb7b3c39e/docs/frontend_api.md#usage-4
  // Helper that activates DarkReader and injects your darkmode.css at the same time
  Ferdium.handleDarkMode(isEnabled => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const isDarkModeParam = searchParams.get('theme');
    let changedParams = false;
    if (isEnabled) {
      !isDarkModeParam
        ? searchParams.set('theme', 'dark') && (changedParams = true)
        : null;
    } else {
      isDarkModeParam
        ? searchParams.delete('theme', 'dark') && (changedParams = true)
        : null;
    }
    changedParams
      ? (url.search = searchParams.toString()) &&
        (window.location.href = url.toString())
      : null;
  });

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));
  Ferdium.initLocalData();
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    setTimeout(() => {
      setTimeForFunc(listerFriendList, 500);
      let mainLoop = setInterval(() => {
        let view = getMainView();
        if (view) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);
    }, 1500);
  });

  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        let key = event.key;
        if (!oneworld.settingCfg.tranflag) return;
        if (isGroup() && !oneworld.settingCfg.groupflag) return;
        if (key === 'Enter') {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          handleSendMessage(document.querySelector(classnameCfg.ipt), msg);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  };

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const replaceAllHtml = data => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.replace(/\s+/g, '\n'); // 过滤所有的空格
    return data;
  };

  const getIptSendMsg = () => {
    return document.querySelector(classnameCfg.ipt).value;
  };

  /**发送消息 */
  const handleSendMessage = async (documents, context) => {
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    if (res.body.code === 500) {
      documents.value = '字符余额不足，请充值';
    } else if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      documents.value = result;
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      setTimeout(() => {
        document.querySelector(classnameCfg.sendBtn)?.click();
      }, 500);
    }
  };

  const listerFriendList = () => {
    document.addEventListener(
      'click',
      e => {
        setTimeForFunc(() => {
          addClickLister(e);
        }, 1000);
      },
      true,
    );
  };

  const addClickLister = e => {
    let parent = getFriendView();
    let target = e.target;
    if (parent && target && parent.contains(target)) addFreshEvent();
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
    const msgList = document.querySelectorAll(classnameCfg.allMsg);
    for (const msgDiv of msgList) {
      const msg = msgDiv.textContent;
      const isOwn =
        msgDiv.parentElement.parentElement.parentElement.className.includes(
          '_ac1q',
        );
      const check = msgDiv.parentElement.childElementCount === 1;
      if(check) {
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
            insterDiv(msgDiv, 'autofanyi', '...', isOwn);
            autoFanyi(msg, msgDiv, isOwn);
          }else{
            insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
            msgDiv.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn));
          }
        } else {
            insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
            msgDiv.parentNode
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn));
        }
      }
    }
  };

  // 判断是群聊还是私聊, true 群聊
  const isGroup = () => {
    let el = document.querySelector(classnameCfg.groupflagEl)
    return el
  }

  const autoFanyi = async (msg, msgDiv, isOwn) => {
    // 自动翻译时隐藏点击翻译按钮
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi');
    if (clickfanyi) clickfanyi.style.display = 'none';

    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    if(!autoFanyi) {
      return
    }
    if(!msg || isNumber(msg)){
      autoFanyi.innerHTML = '';
      return
    }
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (!res.err && res.body.code === 200) {
      autoFanyi.textContent = res.body.data;
    } else if (res.body.code === 500) {
      autoFanyi.textContent = '您的余额已不足';
    } else {
      autoFanyi.textContent = '翻译失败';
    }
  };

  const clickFanyi = async (e, isOwn) => {
    let div = getEventTarget(e);
    let msg = div.parentElement.querySelector(classnameCfg.allMsg).textContent;
    // let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran({
      word: msg,
      from: isOwn ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jfrom,
      to: isOwn ? oneworld.settingCfg.sto : oneworld.settingCfg.jto,
      type: oneworld.settingCfg.type,
    }, oneworld.token);
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.textContent = res.body.data;
    div.removeEventListener('click', clickFanyi);
  };

  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };

  const getFriendView = () => {
    return document.querySelector(classnameCfg.friendList);
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:8px;top:27px;';
    reTranEl.textContent = '重译';
    reTranEl.addEventListener('click', async () => {
      const text = parent.textContent;
      const params = getResData(text, isOwn);
      await Ferdium.getTran(params, oneworld.token, true).then(res => {
        parent.parentElement.querySelector(`.${className}`).textContent =
          res.body.data;
      });
    });
    // parent.parentElement.append(reTranEl);
    parent.insertAdjacentHTML(
      'afterEnd',
      `<div class="${className}" style="margin-right:28px;font-size:${oneworld.settingCfg.fontsize}px;color:${oneworld.settingCfg.fontcolor}">${msg}</div>`,
    );
  };

  const getEventTarget = e => {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  const isNumber = str => {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return patrn.exec(str) == null || str == '' ? false : true;
  };
  // 掩饰
  const setTimeForFunc = (func, time) => {
    setTimeout(func, time);
  };

  const getResData = (msgText, isMe, isSend) => {
    let from, to;
    if (!isSend) {
      from = isMe ? oneworld.settingCfg.sto : oneworld.settingCfg.jfrom;
      to = isMe ? oneworld.settingCfg.sfrom : oneworld.settingCfg.jto;
    } else {
      from = oneworld.settingCfg.sfrom;
      to = oneworld.settingCfg.sto;
    }
    return {
      word: msgText,
      from,
      to,
      type: oneworld.settingCfg.type,
    };
  };

  const updateSettingData = data => {
    oneworld.settingCfg.tranflag = data.tranflag;
    oneworld.settingCfg.groupflag = data.groupflag;
    oneworld.settingCfg.type = data.type;
    oneworld.settingCfg.fontsize = data.fontsize;
    oneworld.settingCfg.fontcolor = data.fontcolor;
    oneworld.settingCfg.sfrom = data.sfrom;
    oneworld.settingCfg.sto = data.sto;
    oneworld.settingCfg.jfrom = data.jfrom;
    oneworld.settingCfg.jto = data.jto;
    oneworld.settingCfg.sendtranslation = data.sendtranslation;
  };
};
