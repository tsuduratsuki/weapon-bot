const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("team4")
    .setDescription("4人用武器抽選（オープン）"),

  async execute(interaction) {

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

    await interaction.deferReply();
    return interaction.editReply({
  content: "抽選方法を選んでください：",
  components: [row]
});
  }
};   

