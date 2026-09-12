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
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const filter = interaction.options.getString("filter");

    await interaction.deferReply();

    const weapons = await getWeaponsCached();

    let filtered = weapons;

    if (sub === "type") {
      filtered = weapons.filter(w => w.type === filter);
    } else if (sub === "sub") {
      filtered = weapons.filter(w => w.sub === filter);
    } else if (sub === "special") {
      filtered = weapons.filter(w => w.special === filter);
    } else if (sub === "normal") {
      // normal は完全ランダムなのでそのまま
      filtered = weapons;
    }

    // 念のため 0 件チェック
    if (filtered.length === 0) {
      return interaction.editReply("該当する武器がありませんでした。");
    }

    const index = Math.floor(Math.random() * filtered.length);
    const result = filtered[index];

    await interaction.editReply({
      embeds: [
        {
          title: "🎯 ソロ武器抽選結果",
          description: `あなたの武器は **${result.name}** です！`,
          color: 0x00aaff,
          fields: [
            { name: "武器種", value: result.type, inline: true },
            { name: "サブ", value: result.sub, inline: true },
            { name: "スペシャル", value: result.special, inline: true }
          ]
        }
      ]
    });
  }
};
