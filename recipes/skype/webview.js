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
    sendBtn();
  });

  const sendBtn = () => {
    setTimeout(() => {
      document.querySelector('button[title="发送消息"]').click();
    }, 500);
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

  const classnameCfg = {
    ipt: '.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr [data-text="true"]',
    sendBtn: "button[title='发送消息']",
    main: '.rxCustomScroll.rxCustomScrollV.active',
    allMsg:
      "div[style='position: relative; display: flex; flex-direction: column; flex-grow: 0; flex-shrink: 0; overflow: hidden; align-items: stretch; padding-left: 11px; padding-right: 12px; padding-top: 9px;']",
    friendList: '.scrollViewport.scrollViewportV',
  };

  const getMessages = () => {
    let count = 0;
    const container = document.querySelector('[role="tablist"] > button > div');
    if (container) {
      const children = container.children;
      if (children.length === 3) {
        const elementContainer = children[children.length - 1];
        if (elementContainer) {
          const element = elementContainer.querySelector(
            '[data-text-as-pseudo-element]',
          );
          if (element && element.dataset) {
            count = Ferdium.safeParseInt(element.dataset.textAsPseudoElement);
          }
        }
      }
    }
    Ferdium.setBadge(count);
  };

  Ferdium.loop(getMessages);

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));
  Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'webview-unsafe.js'));

  // TODO: See how this can be moved into the main ferdium app and sent as an ipc message for opening with a new window or same Ferdium recipe's webview based on user's preferences
  document.addEventListener(
    'click',
    event => {
      const link = event.target.closest('a[href^="http"]');
      const button = event.target.closest('button[title^="http"]');
      if (link || button) {
        const url = link
          ? link.getAttribute('href')
          : button.getAttribute('title');
        event.preventDefault();
        event.stopPropagation();
        if (settings.trapLinkClicks === true) {
          window.location.href = url;
        } else {
          Ferdium.openNewWindow(url);
        }
      }
    },
    true,
  );

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
        if (!oneworld.settingCfg.sendtranslation) return;
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

  const getIptSendMsg = () => {
    return document.querySelector(classnameCfg.ipt).textContent;
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
      documents.textContent = '字符余额不足，请充值';
    } else if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      documents.textContent = result;
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      sendBtn();
    }
  };

  /**删除所有HTML */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const replaceAllHtml = data => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.replace(/\s+/g, '\n'); // 过滤所有的空格
    return data;
  };

  const listerFriendList = () => {
    document.addEventListener(
      'click',
      () => {
        setTimeForFunc(() => {
          addClickLister();
        }, 1000);
      },
      true,
    );
  };

  const addClickLister = () => {
    addFreshEvent();
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
      const check = msgDiv.parentNode.childElementCount === 1;
      const isOwn =
        msgDiv.parentElement.parentElement.style.backgroundColor ===
        'rgb(219, 241, 255)';
      if (check) {
        if (
          !oneworld.settingCfg.tranflag ||
          (isGroup() && !oneworld.settingCfg.groupflag)
        ) {
          insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
          msgDiv.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, isOwn));
        } else {
          insterDiv(msgDiv, 'autofanyi', '...', isOwn);
          autoFanyi(msg, msgDiv, isOwn);
        }
      }
    }
  };

  const autoFanyi = async (msg, msgDiv, isOwn) => {
    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi');
    if (clickfanyi) clickfanyi.style.display = 'none';
    if (!oneworld.settingCfg.tranflag && autoFanyi) autoFanyi.textContent = '';
    if (!isNumber(msg)) {
      let params = getResData(msg, isOwn);
      let res = await Ferdium.getTran(params, oneworld.token);
      if (!res.err && res.body.code == 200) {
        //显示翻译内容
        autoFanyi.textContent = '';
        autoFanyi.textContent = res.body.data;
      } else if (res.body.code == 500) {
        autoFanyi.textContent = '您的余额已不足';
      } else {
        autoFanyi.textContent = '翻译失败';
      }
    } else {
      autoFanyi.style.display = 'none';
    }
  };

  const clickFanyi = async (e, isOwn) => {
    let div = getEventTarget(e);
    let msg = div.parentElement.querySelector(classnameCfg.allMsg).textContent;
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (!res.err && res.body.code === 200) {
      div.textContent = res.body.data;
    } else if (res.body.code === 500) {
      div.textContent = '您的余额已不足';
    } else {
      div.textContent = '翻译失败';
    }
    div.removeEventListener('click', clickFanyi);
  };

  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:0;top:30px;';
    reTranEl.textContent = '重译';
    reTranEl.addEventListener('click', async () => {
      const text = parent.textContent
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
    return !(patrn.exec(str) == null || str == '');
  };
  // 掩饰
  const setTimeForFunc = (func, time) => {
    setTimeout(func, time);
  };
  const isGroup = () => {
    return false;
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
};
