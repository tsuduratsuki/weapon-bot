const { SlashCommandBuilder } = require("discord.js");
const { getWeaponsCached } = require("../utils/getWeaponsCached");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("solo")
    .setDescription("ソロ武器抽選を開始します")

    .addSubcommand(sub =>
      sub
        .setName("normal")
        .setDescription("完全ランダムで抽選します")
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
            .addChoices(
              { name: "シューター", value: "シューター" },
              { name: "ブラスター", value: "ブラスター" },
              { name: "ローラー", value: "ローラー" },
              { name: "チャージャー", value: "チャージャー" },
              { name: "スロッシャー", value: "スロッシャー" },
              { name: "スピナー", value: "スピナー" },
              { name: "マニューバー", value: "マニューバー" },
              { name: "ストリンガー", value: "ストリンガー" },
              { name: "ワイパー", value: "ワイパー" }
            )
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const filter = interaction.options.getString("filter");

    const weapons = await getWeaponsCached();
    console.log(weapons[0]); // データ確認用

    if (!weapons || weapons.length === 0) {
      return interaction.reply("武器データが取得できませんでした。");
    }

    let filtered = weapons;

    // ★ 武器種は w.sub に入っている
    if (sub === "type") {
      filtered = weapons.filter(w => w.sub === filter);
    }

    if (filtered.length === 0) {
      return interaction.reply("該当する武器がありませんでした。");
    }

    const result = filtered[Math.floor(Math.random() * filtered.length)];

    return interaction.reply({
      embeds: [
        {
          title: "🎯 ソロ武器抽選結果",
          description: `あなたの武器は **${result.type}** です！`,
          color: 0x00aaff,
          fields: [
            { name: "武器名", value: result.type, inline: true },
            { name: "武器種", value: result.sub, inline: true },
            { name: "射程（数値）", value: String(result.special), inline: true },
            { name: "ID", value: String(result.name), inline: true }
          ]
        }
      ]
    });
  }
};
