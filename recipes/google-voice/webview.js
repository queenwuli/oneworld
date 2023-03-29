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
      clickSendBtn();
    }, 500);
  });

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
    ipt: '.ng-valid.md-input.gvMessageEntry-input',
    main: '.list.ng-star-inserted',
    allMsg: '.content.ng-star-inserted',
    friendList: '.md-virtual-repeat-scroller',
    sendBtnParent:
      '.layout-align-center-center.layout-column.flex-nogrow.gvMessageEntry-sendContainer',
    sendBtn: '.mat-focus-indicator.mat-tooltip-trigger',
  };

  function parseQuery(query) {
    const el = document.querySelector(query);
    return el && Ferdium.safeParseInt(el.textContent);
  }

  const getMessages = () => {
    const el = document.querySelector('.msgCount');
    let count;

    if (el && el.textContent) {
      count = Ferdium.safeParseInt(el.textContent.replace(/[ ()]/gi, ''));
    } else {
      const count_messages = parseQuery(
        'gv-nav-tab[tooltip="Messages"] div[aria-label="Unread count"]',
      );
      const count_calls = parseQuery(
        'gv-nav-tab[tooltip="Calls"] div[aria-label="Unread count"]',
      );
      const count_voicemails = parseQuery(
        'gv-nav-tab[tooltip="Voicemail"] div[aria-label="Unread count"]',
      );
      count = count_messages + count_calls + count_voicemails;
    }

    Ferdium.setBadge(count);
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
    let view = getMainView();
    if (!view) return;
    let msgList = document.querySelectorAll(classnameCfg.allMsg);
    for (const msgDiv of msgList) {
      const msg = msgDiv.textContent;
      const check = msgDiv.parentNode.childElementCount === 1;
      const isOwn =
        msgDiv.parentElement.parentElement.className.includes('outgoing');
      if (check) {
        if (
          oneworld.settingCfg.tranflag ||
          oneworld.settingCfg.sendtranslation
        ) {
          insterDiv(msgDiv, 'autofanyi', '...', isOwn);
          autoFanyi(msg, msgDiv, isOwn);
        } else {
          insterDiv(msgDiv, 'click-fanyi', '点击翻译', isOwn);
          msgDiv.parentNode
            .querySelectorAll('.click-fanyi')[0]
            .addEventListener('click', e => clickFanyi(e, isOwn), true);
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
      let params = getResData(msg, false);
      let res = await Ferdium.getTran(params, oneworld.token, isOwn);
      if (!res.err && res.body.code === 200) {
        //显示翻译内容
        autoFanyi.textContent = '';
        autoFanyi.textContent = res.body.data;
      } else if (res.body.code === 500) {
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
    let msg = div.parentNode.querySelector(classnameCfg.allMsg).value;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token, isOwn);
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
        if (!oneworld.settingCfg.sendtranslation) return;
        if (key === 'Enter') {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          let ipt = document.querySelector(classnameCfg.ipt);
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
    return ipt.value;
  };

  /**
   * 发送消息
   * !本输入框使用的是textarea  修改innerHtml innerText均无效
   */
  const handleSendMessage = async (documents, context) => {
    let params = getResData(context, true, true);
    const res = await Ferdium.getTran(params, oneworld.token, true);
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    let result;
    if (res.body.code === 500) {
      result = '字符余额不足，请充值';
      documents.value = result;
    }
    if (res.body.code === 200 && res.body.data) {
      result = res.body.data;
      result = result.replace(/</gi, '&lt;'); // 过滤所有的<
      result = result.replace(/>/gi, '&gt;'); // 过滤所有的>
      documents.value = result;
      const evtInput = window.document.createEvent('HTMLEvents');
      evtInput.initEvent('input', true, true);
      documents.dispatchEvent(evtInput);
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
  };

  const clickSendBtn = () => {
    let sendBtn = document
      .querySelector(classnameCfg.sendBtnParent)
      .querySelector(classnameCfg.sendBtn);
    sendBtn.click();
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:8px;top:25px;';
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

  const replaceAllHtml = data => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.replace(/\s+/g, '\n'); // 过滤所有的空格
    return data;
  };
};
