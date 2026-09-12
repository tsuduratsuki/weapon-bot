const { SlashCommandBuilder } = require("discord.js");
const { getWeaponsCached } = require("../utils/getWeaponsCached");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("team4")
    .setDescription("4人用武器抽選を開始します")
    .addSubcommand(sub =>
      sub
        .setName("normal")
        .setDescription("完全ランダムで抽選します")
        .addStringOption(option =>
          option
            .setName("charger")
            .setDescription("チャージャー制限（on/off）")
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName("range")
            .setDescription("長射程制限（on/off）")
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("type")
        .setDescription("武器種を選んで抽選します")
        .addStringOption(option =>
          option
            .setName("filter")
            .setDescription("武器種を選択")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("charger")
            .setDescription("チャージャー制限（on/off）")
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName("range")
            .setDescription("長射程制限（on/off）")
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("sub")
        .setDescription("サブを選んで抽選します")
        .addStringOption(option =>
          option
            .setName("filter")
            .setDescription("サブを選択")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("charger")
            .setDescription("チャージャー制限（on/off）")
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName("range")
            .setDescription("長射程制限（on/off）")
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("special")
        .setDescription("スペシャルを選んで抽選します")
        .addStringOption(option =>
          option
            .setName("filter")
            .setDescription("スペシャルを選択")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("charger")
            .setDescription("チャージャー制限（on/off）")
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName("range")
            .setDescription("長射程制限（on/off）")
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const filter = interaction.options.getString("filter");
    const chargerLimit = interaction.options.getString("charger");
    const rangeLimit = interaction.options.getString("range");

    await interaction.deferReply();

    const weapons = await getWeaponsCached();

    let pool = weapons;

    if (sub === "type") {
      pool = weapons.filter(w => w.type === filter);
    } else if (sub === "sub") {
      pool = weapons.filter(w => w.sub === filter);
    } else if (sub === "special") {
      pool = weapons.filter(w => w.special === filter);
    }

    const isCharger = w => w.type.includes("チャージャー");
    const isLongRange = w =>
      ["リッター", "スプラチャージャー", "ジェットスイーパー", "バレルスピナー"].some(r => w.name.includes(r));

    const result = [];
    let chargerCount = 0;
    let rangeCount = 0;

    while (result.length < 4) {
      const pick = pool[Math.floor(Math.random() * pool.length)];

      if (chargerLimit === "on" && isCharger(pick)) {
        if (chargerCount >= 1) continue;
        chargerCount++;
      }

      if (rangeLimit === "on" && isLongRange(pick)) {
        if (rangeCount >= 2) continue;
        rangeCount++;
      }

      result.push(pick);
    }

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
