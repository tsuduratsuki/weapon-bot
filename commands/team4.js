const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("team4")
    .setDescription("4人用武器抽選を開始します"),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const filter = interaction.options.getString("filter");
    const chargerLimit = interaction.options.getString("charger"); // on/off
    const rangeLimit = interaction.options.getString("range");     // on/off

    await interaction.deferReply();

    // GAS API
    const url = "https://script.google.com/macros/s/AKfycbwu-ojVqeVHhjJ0Uq1UYQ0RtnZuCGWa8UmBW6j2g1AxWJn-M69t7aDR5DewFOnpm-xI/exec";
    const res = await fetch(url);
    const weapons = await res.json();

    // ---------------------------
    // ⭐ mode に応じたフィルター
    // ---------------------------
    let pool = weapons;

    if (sub === "type") {
      pool = weapons.filter(w => w.type === filter);
    } else if (sub === "sub") {
      pool = weapons.filter(w => w.sub === filter);
    } else if (sub === "special") {
      pool = weapons.filter(w => w.special === filter);
    }

    // ---------------------------
    // ⭐ 制限ルール
    // ---------------------------
    const isCharger = w => w.type.includes("チャージャー");
    const isLongRange = w =>
      ["リッター", "スプラチャージャー", "ジェットスイーパー", "バレルスピナー"].some(r => w.name.includes(r));

    const result = [];
    let chargerCount = 0;
    let rangeCount = 0;

    // ---------------------------
    // ⭐ 4人分抽選（制限を守る）
    // ---------------------------
    while (result.length < 4) {
      const pick = pool[Math.floor(Math.random() * pool.length)];

      // チャージャー制限
      if (chargerLimit === "on" && isCharger(pick)) {
        if (chargerCount >= 1) continue;
        chargerCount++;
      }

      // 長射程制限
      if (rangeLimit === "on" && isLongRange(pick)) {
        if (rangeCount >= 2) continue;
        rangeCount++;
      }

      result.push(pick);
    }

    // ---------------------------
    // ⭐ embed で4人分表示
    // ---------------------------
    await interaction.editReply({
      embeds: [
        {
          title: "🎯 4人用武器抽選結果",
          color: 0x00aaff,
          fields: result.map((w, i) => ({
            name: `メンバー${i + 1}`,
            value: `**${w.name}**\n武器種：${w.type}\nサブ：${w.sub}\nスペシャル：${w.special}`
          }))
        }
      ]
    });
  }
};
