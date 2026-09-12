const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("solo")
    .setDescription("ソロ武器抽選を開始します"),

  async execute(interaction) {
    await interaction.reply("ソロ抽選を開始します…");

    // GAS の武器一覧 API
    const url = "https://script.google.com/macros/s/AKfycbwReLt9RQ98jXaUFPFbtOt5dbpq6zgmTeMnEa4xQnFbR57G1xJDvcYmUh45tvq4VO-m/exec";

    // 標準 fetch（Node18）
    const res = await fetch(url);
    const weapons = await res.json();

    // ランダム抽選
    const index = Math.floor(Math.random() * weapons.length);
    const result = weapons[index];

    // 結果を返信（Embed）
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
