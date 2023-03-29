module.exports = (Ferdium) => {
  const oneworld = {
    token: '',
    settingCfg: {
      tranflag: true,
      groupflag: false,
      type: 1,
      fontsize: 12,
      fontcolor: '#000000',
      from: 'zh-CHS',
      to: 'en',
    },
  };
  const getMessages = () => {
    const mentions = document.querySelectorAll('.chat-line .mentioned').length;
    Ferdium.setBadge(mentions, 0);
  };

  Ferdium.loop(getMessages);
};
