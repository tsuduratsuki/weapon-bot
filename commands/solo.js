const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('solo')
    .setDescription('ソロ抽選を実行します'),

  async execute(interaction) {
    await interaction.reply('ソロ抽選を開始します！');
  }
};
