const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("solo")
    .setDescription("ソロ武器抽選"),

  async execute(interaction) {

    const modeMenu = new StringSelectMenuBuilder()
      .setCustomId("soloMode")
      .setPlaceholder("抽選方法を選んでください")
      .addOptions([
        { label: "通常抽選（制限なし）", value: "normal" },
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
