const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("team4")
    .setDescription("4人用武器抽選（プラベ）"),

  async execute(interaction) {

    // ★ deferReply を使わない（壊れた interaction の原因）
    // ★ reply を1回だけ送る（Discordが最も壊れない方法）

    const modeMenu = new StringSelectMenuBuilder()
      .setCustomId("team4Mode_v2")
      .setPlaceholder("抽選方法を選んでください")
      .addOptions([
        { label: "通常抽選（ルール選択）", value: "normal" },
        { label: "武器種限定", value: "type" },
        { label: "サブ限定", value: "sub" },
        { label: "スペシャル限定", value: "special" }
      ]);

    const row = new ActionRowBuilder().addComponents(modeMenu);

    return interaction.reply({
      content: "抽選方法を選んでください：",
      components: [row]
    });
  }
};
