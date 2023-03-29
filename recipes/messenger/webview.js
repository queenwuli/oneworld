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

  // 文件名
  let classname = {
    ipt: 'div[aria-label="发消息"] span',
    sendBtn: 'div[aria-label="按 Enter 键发送"]',
    main: '.xc8icb0.x1ja2u2z',
    allMsg: '.x9f619.x1n2onr6.x1ja2u2z.__fb-light-mode',
    friendList: 'div[aria-label="聊天"]',
  };

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data);
  });
  Ferdium.ipcRenderer.on('send-info', () => {
    setTimeout(() => {
      document.querySelector(classname.sendBtn).click();
    }, 500);
  });

  const getMessages = () => {
    let count = [
      ...document.querySelectorAll(
        '.bp9cbjyn.j83agx80.owycx6da:not(.btwxx1t3)',
      ),
    ]
      .map(elem => {
        const hasPing = !!elem.querySelector(
          '.pq6dq46d.is6700om.qu0x051f.esr5mh6w.e9989ue4.r7d6kgcz.s45kfl79.emlxlaya.bkmhp75w.spb7xbtv.cyypbtt7.fwizqjfa',
        );
        const isMuted = !!elem.querySelector(
          '.a8c37x1j.ms05siws.l3qrxjdp.b7h9ocf4.trssfv1o',
        );

        return hasPing && !isMuted;
      })
      .reduce((prev, curr) => prev + curr, 0);
    /*
     *在通知计数器顶部添加消息请求计数
     */
    const messageRequestsElement = document.querySelector('._5nxf');
    if (messageRequestsElement) {
      count += Ferdium.safeParseInt(messageRequestsElement.textContent);
    }
    Ferdium.setBadge(count);
  };

  const getActiveDialogTitle = () => {
    const element = [
      document.querySelector(
        '.cbu4d94t:not(.kr9hpln1) .l9j0dhe7 .pfnyh3mw .g5gj957u .ni8dbmo4.stjgntxs.g0qnabr5.ltmttdrg.ekzkrbhg.mdldhsdk.oo9gr5id',
      ),
      document.querySelector(
        '.j83agx80.cbu4d94t.d6urw2fd.dp1hu0rb.l9j0dhe7.du4w35lb:not(.kr9hpln1) .rq0escxv[role="main"] .t6p9ggj4.tkr6xdv7 .d2edcug0.j83agx80.bp9cbjyn.aahdfvyu.bi6gxh9e .a8c37x1j.ni8dbmo4.stjgntxs.l9j0dhe7.ltmttdrg.g0qnabr5.ojkyduve a.lzcic4wl.gmql0nx0.gpro0wi8.lrazzd5p',
      ),
    ].find(Boolean);

    Ferdium.setDialogTitle(element ? element.textContent : null);
  };

  const loopFunc = () => {
    getMessages();
    getActiveDialogTitle();
  };

  Ferdium.loop(loopFunc);

  //初始化
  Ferdium.initLocalData();
  Ferdium.initOneWorld(() => {
    setTimeout(() => {
      console.log('ready to translation');
      setTimeForFunc(listerFriendList, 500);
      let mainLoop = setInterval(() => {
        const main = getMainView();
        if (main) {
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
      event => {
        let key = event.key;
        if (!oneworld.settingCfg.sendtranslation) return;
        if (key === 'Enter') {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          handleSendMessage(document.querySelector(classname.ipt), msg);
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
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    if (res.body.code === 500) {
      documents.childNodes[0].textContent = '字符余额不足，请充值';
    } else if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/</gi, '&lt;');
      result = result.replace(/>/gi, '&gt;');
      documents.childNodes[0].textContent = result;
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      documents.dispatchEvent(evt);
      setTimeout(() => {
        document.querySelector(classname.sendBtn).click();
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
    return document.querySelector(classname.ipt).textContent;
  };

  //获取主消息列表
  const getMainView = () => {
    return document.querySelector(classname.main);
  };

  //获取好友列表
  const getFriendView = () => {
    return document.querySelectorAll(classname.friendList);
  };

  //好友列表监听
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

  //监听是否点击到好友列表
  const addClickLister = e => {
    let target = e.target;
    let friendView = getFriendView();
    if (friendView[0] && friendView[0].contains(target)) {
      setTimeForFunc(addFreshEvent, 500);
    }
    if (friendView[1] && friendView[1].contains(target)) {
      setTimeForFunc(addFreshEvent, 500);
    }
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
    let msgList = document.querySelectorAll(classname.allMsg);
    for (const msg of msgList) {
      const isOwn =
        msg.parentElement.style.backgroundColor === 'rgb(0, 132, 255)';
      const text = msg.textContent.split('\n')[0];
      const check = msg.parentNode.childElementCount === 1;
      if (check) {
        if (
          oneworld.settingCfg.tranflag ||
          oneworld.settingCfg.sendtranslation
        ) {
          insterDiv(msg, 'autofanyi', '...', isOwn);
          autoFanyi(text, msg, isOwn);
        } else {
          insterDiv(msg, 'click-fanyi', '点击翻译', isOwn);
          msg.parentNode
            .querySelector('.click-fanyi')
            .addEventListener('click', e => clickFanyi(e, isOwn), true);
        }
      }
    }
  };

  const clickFanyi = async (e, isOwn) => {
    let div = getEventTarget(e);
    let msg = div.parentElement.querySelector(classname.allMsg).textContent;
    let params = getResData(msg, isOwn);
    let res = await Ferdium.getTran(params, oneworld.token);
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.textContent = res.body.data;
    div.removeEventListener('click', clickFanyi);
  };

  const autoFanyi = async (msg, msgDiv, isOwn) => {
    let autoFanyi = msgDiv.parentNode.querySelector('.autofanyi');
    let clickfanyi = msgDiv.parentNode.querySelector('.click-fanyi');
    if (clickfanyi) clickfanyi.style.display = 'none';
    if (!oneworld.settingCfg.tranflag && autoFanyi) autoFanyi.textContent = '';
    if (!isNumber(msg)) {
      let params = getResData(msg, isOwn);
      let res = await Ferdium.getTran(params, oneworld.token);
      if (!res.err && res.body.code === 200) {
        //显示翻译内容
        autoFanyi.innerHTML = '';
        autoFanyi.innerHTML = res.body.data;
      } else if (res.body.code === 500) {
        autoFanyi.innerHTML = '您的余额已不足';
      } else {
        autoFanyi.innerHTML = '翻译失败';
      }
    } else {
      autoFanyi.style.display = 'none';
    }
  };

  // 获取事件目标
  const getEventTarget = e => {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const isNumber = str => {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    return !(patrn.exec(str) == null || str === '');
  };
  // 掩饰
  // eslint-disable-next-line unicorn/consistent-function-scoping
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

  const insterDiv = (parent, className, msg, isOwn) => {
    const reTranEl = document.createElement('span');
    reTranEl.style.cssText =
      'font-size:12px;position:absolute;right:8px;top:25px;';
    reTranEl.textContent = '重译';
    reTranEl.addEventListener('click', async () => {
      const text = parent.textContent.slice(
        0,
        Math.max(0, parent.textContent.length - 5),
      );
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
