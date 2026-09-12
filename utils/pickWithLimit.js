// pickWithLimit.js
function pickWithLimit(weapons, count, chargerLimit, rangeLimit) {
  const result = [];
  let chargers = 0;
  let ranges = 0;

  while (result.length < count) {
    const w = weapons[Math.floor(Math.random() * weapons.length)];

    // チャージャー制限
    if (chargerLimit === "on" && w.type === "チャージャー") {
      if (chargers >= 1) continue;
      chargers++;
    }

    // 長射程制限（例：スプラチャージャー系など）
    if (rangeLimit === "on" && w.range === "long") {
      if (ranges >= 2) continue;
      ranges++;
    }

    result.push(w);
  }

  return result;
}

module.exports = { pickWithLimit };
