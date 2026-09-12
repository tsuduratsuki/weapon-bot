require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

// ★ あなたの GAS API URL を入れてね
const GAS_URL = "https://script.google.com/macros/s/あなたのURL/exec";

// Node18 の標準 fetch
async function getWeapons() {
  const res = await fetch(GAS_URL);
  return await res.json();
}

async function main() {
  console.log("GAS から武器一覧を取得中…");

  const weapons = await getWeapons();

  // ⭐ 武器種・サブ・スペシャルの一覧を自動生成
  const types = [...new Set(weapons.map(w => w.type))];
  const subs = [...new Set(weapons.map(w => w.sub))];
  const specials = [...new Set(weapons.map(w => w.special))];

  console.log("抽選用データ生成完了");

  // ⭐ /solo のコマンドを自動生成
  const soloCommand = new SlashCommandBuilder()
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
    .addStringOption(option => {
      option
        .setName("filter")
        .setDescription("武器種・サブ・スペシャルを選択（限定抽選の場合）")
        .setRequired(false);

      // ⭐ ここで choices を自動生成
      types.forEach(t => option.addChoices({ name: `武器種：${t}`, value: t }));
      subs.forEach(s => option.addChoices({ name: `サブ：${s}`, value: s }));
      specials.forEach(sp => option.addChoices({ name: `スペシャル：${sp}`, value: sp }));

      return option;
    });

  const commands = [soloCommand.toJSON()];

  // ⭐ Discord に登録
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("Discord にコマンドを登録中…");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("登録完了！");
  } catch (err) {
    console.error(err);
  }
}

main();
