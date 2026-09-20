// ルールごとの条件セット
const RULE_CONDITIONS = {
  area: {
  min: { "塗り強": 1 },
  max: { 
    "後衛": 1,
    "重量": 1,
    "塗り弱": 2
  }
}
,
  yagura: {
    min: { "前衛": 1, "中衛": 1 },
    max: { "後衛": 1 }
  },
  hoko: {
    min: { "前衛": 1 },
    max: { "後衛": 1, "重量": 1 }
  },
  asari: {
    min: { "前衛": 1 },
    max: { "後衛": 1 }
  }
};

// ルール別抽選ロジック
function pickByRule(weapons, count, rule) {
  const result = [];
  const conditions = RULE_CONDITIONS[rule];
  const counters = {};

  while (result.length < count) {
    const w = weapons[Math.floor(Math.random() * weapons.length)];
    const tags = w.tags || [];

    // 最大条件チェック
    let violated = false;
    for (const tag of tags) {
      if (conditions.max && conditions.max[tag]) {
        const current = counters[tag] || 0;
        if (current >= conditions.max[tag]) {
          violated = true;
          break;
        }
      }
    }
    if (violated) continue;

    // 追加
    result.push(w);
    for (const tag of tags) {
      counters[tag] = (counters[tag] || 0) + 1;
    }
  }

  // 最低条件チェック
  for (const tag in conditions.min) {
    const required = conditions.min[tag];
    const current = counters[tag] || 0;
    if (current < required) {
      return pickByRule(weapons, count, rule); // やり直し
    }
  }

  return result;
}

module.exports = { pickByRule };
