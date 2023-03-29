const _path = _interopRequireDefault(require('path'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

module.exports = (Ferdium, settings) => {
  //获取消息
  const getMessages = () => {
    let directCount = 0;
    const directCountPerServer = document.querySelectorAll(
      '[class*="lowerBadge-"] [class*="numberBadge-"]',
    );

    for (const directCountBadge of directCountPerServer) {
      directCount += Ferdium.safeParseInt(directCountBadge.textContent);
    }
    //每个服务器的间接计数
    const indirectCountPerServer = document.querySelectorAll(
      '[class*="modeUnread-"]',
    ).length;
    //设置应用的信息角标
    Ferdium.setBadge(directCount, indirectCountPerServer);
  };

  Ferdium.loop(getMessages);

  //注入CSS样式
  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));

  // TODO:看看如何将其移动到主ferdium应用程序中，并作为ipc消息发送，以便根据用户的偏好打开新窗口或相同ferdium-recipe的网络视图
  //添加事件侦听器  点击事件
  document.addEventListener(
    'click',
    event => {
      const link = event.target.closest('a[href^="http"]');
      const button = event.target.closest('button[title^="http"]');
      if (link || button) {
        const url = link
          ? link.getAttribute('href')
          : button.getAttribute('title');
        const skipDomains = [
          /^https:\/\/discordapp\.com\/channels\//i,
          /^https:\/\/discord\.com\/channels\//i,
        ];
        let stayInsideDiscord;
        skipDomains.every(skipDomain => {
          stayInsideDiscord = skipDomain.test(url);
          return !stayInsideDiscord;
        });

        if (!Ferdium.isImage(link) && !stayInsideDiscord) {
          event.preventDefault();
          event.stopPropagation();
          if (settings.trapLinkClicks === true) {
            window.location.href = url;
          } else {
            Ferdium.openNewWindow(url);
          }
        }
      }
    },
    true,
  );

  //--------------------------------ferdium-----------------------------结束

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

  // 文件名
  let classname = {
    friendList: '.wrapper-3kah-n',
    ipt: 'div[role="textbox"] [data-slate-string="true"]',
    main: '[data-list-id="chat-messages"]',
    allMsg: '.markup-eYLPri.messageContent-2t3eCI',
    // sendBtn: '.Button.send.default.secondary.round.click-allowed',
  };

  //服务设置更新
  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    sendBtn(document.querySelector(classname.ipt));
  });

  //初始化
  Ferdium.initLocalData();
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    setTimeout(() => {
      setTimeForFunc(listerFriendList, 500);
      const mainLoop = setInterval(() => {
        const view = getMainView();
        if (view) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);
    }, 500);
  });

  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      async event => {
        if (!oneworld.settingCfg.sendtranslation) return;
        if (event.ctrlKey && event.code === 'Enter') {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          await handleSendMessage(document.querySelector(classname.ipt), msg);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
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
    return document.querySelector(classname.ipt).textContent;
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
      sendBtn(documents);
    }
  };

  const sendBtn = documents => {
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', {
        keyCode: 13,
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        composed: true,
      });
      documents.dispatchEvent(event);
    }, 500);
  };

  //好友列表监听
  const listerFriendList = () => {
    document.addEventListener(
      'click',
      e => {
        setTimeForFunc(() => {
          addClickLister(e);
        }, 500);
      },
      true,
    );
  };

  //监听是否点击到好友列表
  const addClickLister = e => {
    let friendView = getFriendView();
    let target = e.target;
    if (friendView[0] && friendView[0].contains(target)) {
      setTimeForFunc(addFreshEvent, 500);
    }
    if (friendView[1] && friendView[1].contains(target)) {
      setTimeForFunc(addFreshEvent, 500);
    }
  };

  //添加新事件
  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      freshChatList();
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  //新的聊天列表
  const freshChatList = () => {
    let view = getMainView();
    if (!view) return;
    const msgList = document.querySelectorAll(classname.allMsg);
    const placeHolder = document.querySelector(
      '.placeholder-1rCBhr.slateTextArea-27tjG0',
    )
    if (placeHolder.textContent !== 'curl+enter发送翻译') {
      placeHolder.textContent = 'curl+enter发送翻译';
    }
    for (const msgDiv of msgList) {
      const msg = msgDiv.textContent;
      const num = msgDiv.parentElement.querySelector('h3') ? 3 : 2;
      const check = msgDiv.parentNode.childElementCount === num;
      if (check) {
        const isOwn =
          msgDiv.parentElement.parentElement.className.includes(
            'mentioned-Tre-dv',
          );
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
      const params = getResData(msg, isOwn);
      const res = await Ferdium.getTran(params, oneworld.token);
      if (!res.err && res.body.code === 200) {
        //显示翻译内容
        autoFanyi.textContent = '';
        autoFanyi.textContent = res.body.data;
      } else {
        autoFanyi.textContent = '翻译失败';
      }
    } else {
      autoFanyi.style.display = 'none';
    }
  };

  const clickFanyi = async (e, isOwn) => {
    let div = getEventTarget(e);
    let msg = div.previousSibling.textContent;
    let params = getResData(msg, isOwn);
    console.log(params);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.textContent = res.body.data;
    div.removeEventListener('click', clickFanyi);
  };

  //获取主消息列表
  const getMainView = () => {
    return document.querySelector(classname.main);
  };
  //获取好友列表
  const getFriendView = () => {
    return document.querySelectorAll(classname.friendList);
  };

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.className = 'markup-eYLPri';
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
    return !(patrn.exec(str) == null || str === '');
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
