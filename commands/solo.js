const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("solo")
    .setDescription("ソロ武器抽選を開始します")
    .addStringOption(option =>
      option
        .setName("mode")
        .setDescription("抽選方法を選んでください")
        .setRequired(true)
        .addChoices(
          { name: "通常（完全ランダム）", value: "normal" },
          { name: "武器種限定", value: "type" },
          { name: "サブ限定", value: "sub" },
          { name: "スペシャル限定", value: "special" }
        )
    )
    .addStringOption(option =>
      option
        .setName("filter")
        .setDescription("武器種・サブ・スペシャルを選択（限定抽選の場合）")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.reply("ソロ抽選を開始します…");

    // ★ あなたの GAS API URL を入れてね
    const url = "https://script.google.com/macros/s/AKfycbwReLt9RQ98jXaUFPFbtOt5dbpq6zgmTeMnEa4xQnFbR57G1xJDvcYmUh45tvq4VO-m/exec";

    const res = await fetch(url);
    const weapons = await res.json();

    const mode = interaction.options.getString("mode");
    const filter = interaction.options.getString("filter");

    // ⭐ プルダウンの自動生成（武器種・サブ・スペシャル一覧）
    const types = [...new Set(weapons.map(w => w.type))];
    const subs = [...new Set(weapons.map(w => w.sub))];
    const specials = [...new Set(weapons.map(w => w.special))];

    let filtered = weapons;

    // ⭐ 抽選モードごとのフィルタリング
    if (mode === "type") {
      filtered = weapons.filter(w => w.type === filter);
    } else if (mode === "sub") {
      filtered = weapons.filter(w => w.sub === filter);
    } else if (mode === "special") {
      filtered = weapons.filter(w => w.special === filter);
    }

    // ⭐ 抽選
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
