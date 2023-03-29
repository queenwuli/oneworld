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

  const classnameCfg = {
    ipt: 'div[data-testid="dmComposerTextInput"]',
    main: 'div[data-testid="DmScrollerContainer"]',
    allMsg: 'div[data-testid="tweetText"]',
    friendList:
      '.css-1dbjc4n.r-14lw9ot.r-16y2uox.r-1jgb5lz.r-1ye8kvj.r-13qz1uu',
    sendBtn: 'div[data-testid="dmComposerSendButton"]',
    groupflagEl: 'section[aria-labelledby="detail-header"] .css-9pa8cd'
  };
  const getMessages = () => {
    let direct = 0;
    const notificationsElement = document.querySelector(
      '[data-testid=AppTabBar_Notifications_Link] div div div',
    );
    if (notificationsElement) {
      direct += Ferdium.safeParseInt(notificationsElement.textContent);
    }
    const DMElement = document.querySelector(
      '[data-testid=AppTabBar_DirectMessage_Link] div div div',
    );
    if (DMElement) {
      direct += Ferdium.safeParseInt(DMElement.textContent);
    }
    Ferdium.setBadge(direct);
  };

  Ferdium.loop(getMessages);

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classnameCfg.sendBtn).click();
    }, 500);
  });

  Ferdium.initLocalData();
  Ferdium.initOneWorld(() => {
    setTimeout(() => {
      setTimeout(() => {
        Ferdium.getToken();
        let mainLoop = setInterval(() => {
          const view = getMainView();
          if (view) {
            addKeyDownAndTran();
            setTimeForFunc(addFreshEvent, 500);
            clearInterval(mainLoop);
          }
        }, 500);
        setTimeForFunc(listerFriendList, 500);
      }, 1000);
    }, 500);
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

  /**发送消息 */
  const handleSendMessage = async (documents, context) => {
    const params = getResData(context, true, true);
    params.isSend = true;
    const res = await Ferdium.getTran(params, oneworld.token);
    const realTextEl = documents.querySelector('[data-text="true"]');
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    if (res.body.code === 500) {
      realTextEl.textContent = '字符余额不足，请充值';
    } else if (res.body.code === 200 && res.body.data) {
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      realTextEl.textContent = res.body.data;
      documents.dispatchEvent(evt);
      setTimeout(() => {
        document.querySelector(classnameCfg.sendBtn).click();
      }, 500);
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

  const getIptSendMsg = () => {
    return document.querySelector(classnameCfg.ipt).textContent;
  };

  const listerFriendList = () => {
    document.addEventListener(
      'click',
      () => {
        setTimeForFunc(addFreshEvent, 1000);
      },
      true,
    );
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
      const isOwn = msgDiv.parentElement.className.includes('r-173mn98');
      if (check) {
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
            insterDiv(msgDiv, 'autofanyi', '...', isOwn);
            autoFanyi(msg, msgDiv, isOwn);
          }else{
            insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
              msg.parentNode
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

  const clickFanyi = async (e, isOwn) => {
    const div = getEventTarget(e);
    const msg = div.parentNode.querySelector(classnameCfg.allMsg).textContent;
    // const params = getResData(msg, isOwn);
    const res = await Ferdium.getTran({
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

  // 判断是群聊还是私聊, true 群聊
  const isGroup = () => {
    let el = document.querySelectorAll(classnameCfg.groupflagEl)
    return el && el.length > 1
  }

  const autoFanyi = async (msg, msgDiv, isOwn) => {
    // 自动翻译时隐藏点击翻译按钮
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi');
    if (clickfanyi) clickfanyi.style.display = 'none';

    const autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    if(!autoFanyi) {
      return
    }
    if(!msg || isNumber(msg)){
      autoFanyi.innerHTML = '';
      return
    }
    const params = getResData(msg, isOwn);
    const res = await Ferdium.getTran(params, oneworld.token);
    if (!res.err && res.body.code === 200) {
      autoFanyi.innerHTML = res.body.data;
    } else if (res.body.code === 500) {
      autoFanyi.innerHTML = '您的余额已不足';
    } else {
      autoFanyi.innerHTML = '翻译失败';
    }
  };

  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:8px;top:32px;';
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
    return !(patrn.exec(str) == null || str == '');
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
