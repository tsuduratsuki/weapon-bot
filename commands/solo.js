const { SlashCommandBuilder } = require("discord.js");
const { getWeaponsCached } = require("../utils/getWeaponsCached");

const TYPE_CHOICES = [
  { name: "シューター", value: "シューター" },
  { name: "ブラスター", value: "ブラスター" },
  { name: "ローラー", value: "ローラー" },
  { name: "チャージャー", value: "チャージャー" },
  { name: "スロッシャー", value: "スロッシャー" },
  { name: "スピナー", value: "スピナー" },
  { name: "マニューバー", value: "マニューバー" },
  { name: "ストリンガー", value: "ストリンガー" },
  { name: "ワイパー", value: "ワイパー" }
];

const SUB_CHOICES = [
  { name: "クイックボム", value: "クイックボム" },
  { name: "スプラッシュボム", value: "スプラッシュボム" },
  { name: "キューバンボム", value: "キューバンボム" },
  { name: "カーリングボム", value: "カーリングボム" },
  { name: "ポイズンミスト", value: "ポイズンミスト" },
  { name: "ポイントセンサー", value: "ポイントセンサー" },
  { name: "ラインマーカー", value: "ラインマーカー" },
  { name: "スプリンクラー", value: "スプリンクラー" },
  { name: "トラップ", value: "トラップ" }
];

const SPECIAL_CHOICES = [
  { name: "ウルトラショット", value: "ウルトラショット" },
  { name: "ナイスダマ", value: "ナイスダマ" },
  { name: "ジェットパック", value: "ジェットパック" },
  { name: "トリプルトルネード", value: "トリプルトルネード" },
  { name: "キューインキ", value: "キューインキ" },
  { name: "メガホンレーザー5.1ch", value: "メガホンレーザー5.1ch" },
  { name: "ショクワンダー", value: "ショクワンダー" },
  { name: "サメライド", value: "サメライド" },
  { name: "ホップソナー", value: "ホップソナー" },
  { name: "テイオウイカ", value: "テイオウイカ" }
];

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
            .addChoices(...TYPE_CHOICES)
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
            .addChoices(...SUB_CHOICES)
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
            .addChoices(...SPECIAL_CHOICES)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const filter = interaction.options.getString("filter");

    // ★ deferReply は絶対に使わない（index.js と衝突するため）
    const weapons = await getWeaponsCached();
    console.log(weapons[0]); // ← データ確認用（あとで消してOK）

    if (!weapons || weapons.length === 0) {
      return interaction.reply("武器データが取得できませんでした。");
    }

    let filtered = weapons;

    if (sub === "type") {
      filtered = weapons.filter(w => w.type === filter);
    } else if (sub === "sub") {
      filtered = weapons.filter(w => w.sub === filter);
    } else if (sub === "special") {
      filtered = weapons.filter(w => w.special === filter);
    }

    if (filtered.length === 0) {
      return interaction.reply("該当する武器がありませんでした。");
    }

    const result = filtered[Math.floor(Math.random() * filtered.length)];

    return interaction.reply({
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
