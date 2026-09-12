const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("solo")
    .setDescription("ソロ武器抽選を開始します")

    // ⭐ 抽選方法（分かりやすい名前に変更）
    .addStringOption(option =>
      option
        .setName("mode")
        .setDescription("抽選方法を選んでください")
        .setRequired(true)
        .addChoices(
          { name: "完全ランダム", value: "normal" },
          { name: "武器種を選んで抽選", value: "type" },
          { name: "サブを選んで抽選", value: "sub" },
          { name: "スペシャルを選んで抽選", value: "special" }
        )
    )

    // ⭐ 武器種一覧（名前を分かりやすく）
    .addStringOption(option =>
      option
        .setName("weapon_type")
        .setDescription("武器種一覧（武器種を選んで抽選の場合）")
        .setRequired(false)
    )

    // ⭐ サブ一覧
    .addStringOption(option =>
      option
        .setName("weapon_sub")
        .setDescription("サブ一覧（サブを選んで抽選の場合）")
        .setRequired(false)
    )

    // ⭐ スペシャル一覧
    .addStringOption(option =>
      option
        .setName("weapon_special")
        .setDescription("スペシャル一覧（スペシャルを選んで抽選の場合）")
        .setRequired(false)
    ),

  async execute(interaction) {
    const mode = interaction.options.getString("mode");

    // ⭐ mode に応じて使うフィルターを切り替える
    let filter = null;

    if (mode === "type") {
      filter = interaction.options.getString("weapon_type");
    } else if (mode === "sub") {
      filter = interaction.options.getString("weapon_sub");
    } else if (mode === "special") {
      filter = interaction.options.getString("weapon_special");
    }

    // ⭐ フィルターが必要なのに選ばれていない場合
    if (mode !== "normal" && !filter) {
      return interaction.reply({
        content: "一覧から選んでください。",
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const url = "https://script.google.com/macros/s/AKfycbwReLt9RQ98jXaUFPFbtOt5dbpq6zgmTeMnEa4xQnFbR57G1xJDvcYmUh45tvq4VO-m/exec";
    const res = await fetch(url);
    const weapons = await res.json();

    let filtered = weapons;

    if (mode === "type") {
      filtered = weapons.filter(w => w.type === filter);
    } else if (mode === "sub") {
      filtered = weapons.filter(w => w.sub === filter);
    } else if (mode === "special") {
      filtered = weapons.filter(w => w.special === filter);
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
