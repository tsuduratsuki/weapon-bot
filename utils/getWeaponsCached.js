const fetch = require("node-fetch");

async function getWeaponsCached() {
  const res = await fetch(process.env.GAS_URL);
  const data = await res.json();
  return data;
}

module.exports = { getWeaponsCached };
