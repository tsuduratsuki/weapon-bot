const fetch = require("node-fetch");

let cachedWeapons = null;
let lastFetchTime = 0;

async function getWeaponsCached() {
  const now = Date.now();

  // 10分キャッシュ
  if (cachedWeapons && now - lastFetchTime < 10 * 60 * 1000) {
    return cachedWeapons;
  }

  const res = await fetch(process.env.GAS_URL);
  const data = await res.json();

  cachedWeapons = data;
  lastFetchTime = now;

  return data;
}

module.exports = { getWeaponsCached };
