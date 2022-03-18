module.exports = {
  passwordToArr(obj) {
    return Object.entries(obj).map(([, { name, mailOrPhone }]) => ({
      name,
      mailOrPhone,
    }));
  },
};
