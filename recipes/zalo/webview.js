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
    document.execCommand('paste');
    setTimeout(() => {
      clickSendBtn();
    }, 500);
  });

  const classnameCfg = {
    ipt: '#input_line_0',
    main: '.message-view__scroll__inner.fadeInAndOut',
    allMsg: '.card--text',
    friendList: '.ReactVirtualized__Grid.ReactVirtualized__List',
    sendBtn: '.send-btn-chatbar',
    groupflagEl: '#ava_chat_box_view .a-child'
  };
  const getMessages = () => {
    const notificationBadge = document.querySelectorAll('.tab-red-dot').length;
    Ferdium.setBadge(notificationBadge);
  };

  Ferdium.loop(getMessages);
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
    const view = getMainView();
    if (!view) return;
    const msgList = view.querySelectorAll(classnameCfg.allMsg);
    for (const msgDiv of msgList) {
      const msg = msgDiv.querySelector('.text');
      const text = msg.textContent;
      const isOwn = msgDiv.className.includes('me');
      const check = msg.parentElement.children.length === 1;
      if (check) {
        if ((oneworld.settingCfg.sendtranslation && !isOwn) || (oneworld.settingCfg.tranflag && isOwn)) {
          // 如果是群聊则跟进群聊开关判断
          if((isGroup() && oneworld.settingCfg.groupflag) || !isGroup()) {
            insterDiv(msg, 'autofanyi', '...', isOwn);
            autoFanyi(text, msg, isOwn);
          }else{
            insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
            msgDiv
              .querySelector('.click-fanyi')
              .addEventListener('click', e => clickFanyi(e, isOwn));
          }
        } else {
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msgDiv
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, isOwn));
        }
      }
    }
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

    const autoFanyi = msgDiv.parentElement.querySelector('.autofanyi');
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
    const div = getEventTarget(e);
    const msg = div.parentElement.children.item(0).textContent;
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

  const getMainView = () => {
    return document.querySelector(classnameCfg.main);
  };

  const getFriendView = () => {
    return document.querySelector(classnameCfg.friendList);
  };

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
          const ipt = document.querySelector(classnameCfg.ipt);
          handleSendMessage(ipt, msg);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  };

  const getIptSendMsg = () => {
    let ipt = document.querySelector(classnameCfg.ipt);
    return ipt.textContent;
  };

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
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.textContent = res.body.data;
      documents.dispatchEvent(evt);
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
  };

  const clickSendBtn = () => {
    let sendBtn = document.querySelector(classnameCfg.sendBtn);
    sendBtn.click();
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:8px;top:35px;';
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

  const replaceAllHtml = data => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.replace(/\s+/g, '\n'); // 过滤所有的空格
    return data;
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
