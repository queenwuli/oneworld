module.exports = Ferdium => {
  const getMessages = () => {
    // all overdue items are being counted
    let count = document.querySelectorAll('.duedate-overdue').length;
    let mbadge2 = document.querySelectorAll('.MdIcoBadge02')?.[0];
    count = mbadge2 ? count + mbadge2.textContent : count;
    Ferdium.setBadge(count);
  };

  Ferdium.loop(getMessages);
};
