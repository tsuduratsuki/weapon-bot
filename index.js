require("dotenv").config();

const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("clientReady", () => {
  console.log("Botがオンラインになりました！");
});

// ---------------------------
// GASデータ取得 + キャッシュ
// ---------------------------
let cachedWeapons = null;
let lastFetchTime = 0;

async function getWeaponsCached() {
  const now = Date.now();

  if (cachedWeapons && now - lastFetchTime < 10 * 60 * 1000) {
    return cachedWeapons;
  }

  const url = "https://script.google.com/macros/s/AKfycbwReLt9RQ98jXaUFPFbtOt5dbpq6zgmTeMnEa4xQnFbR57G1xJDvcYmUh45tvq4VO-m/exec";
  const res = await fetch(url);
  const data = await res.json();

  cachedWeapons = data;
  lastFetchTime = now;

  return data;
}

// ---------------------------
// 設定の保存場所（必須）
// ---------------------------
let team4Settings = {
  mode: null,
  charger: null,
  range: null
};

let team8Settings = {
  mode: null,
  charger: null,
  range: null
};

// ---------------------------
// メッセージコマンド
// ---------------------------

// 1人用
client.on("messageCreate", async message => {
  if (message.content === "!solo") {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("soloMode")
      .setPlaceholder("抽選方法を選んでください")
      .addOptions([
        { label: "通常抽選", value: "normal" },
        { label: "武器種で抽選", value: "type" },
        { label: "サブで抽選", value: "sub" },
        { label: "スペシャルで抽選", value: "special" }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await message.reply({ content: "抽選方法を選んでください：", components: [row] });
  }
});

function pickWithLimit(list, count, chargerLimit, rangeLimit) {
  let pool = [...list]; // コピーして使う
  let result = [];
  let chargerCount = 0;
  let rangeCount = 0;

  while (result.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const pick = pool[index];

    if (chargerLimit === "on" && pick.charger === 1 && chargerCount >= 1) {
      pool.splice(index, 1);
      continue;
    }

    if (rangeLimit === "on" && pick.range === "長" && rangeCount >= 2) {
      pool.splice(index, 1);
      continue;
    }

    result.push(pick);
    pool.splice(index, 1);

    if (pick.charger === 1) chargerCount++;
    if (pick.range === "長") rangeCount++;
  }

  return result;
}

// ---------------------------
// 4人用
// ---------------------------
client.on("messageCreate", async message => {
  if (message.content === "!team4") {

    // 初期化
    team4Settings.mode = null;
    team4Settings.charger = null;
    team4Settings.range = null;

    const modeMenu = new StringSelectMenuBuilder()
      .setCustomId("team4Mode")
      .setPlaceholder("抽選方法を選んでください")
      .addOptions([
        { label: "通常抽選", value: "normal" },
        { label: "武器種で抽選", value: "type" },
        { label: "サブで抽選", value: "sub" },
        { label: "スペシャルで抽選", value: "special" }
      ]);

    const row1 = new ActionRowBuilder().addComponents(modeMenu);

    await message.reply({
      content: "抽選方法を選んでください：",
      components: [row1]
    });
  }
});

// ---------------------------
// 8人用
// ---------------------------
client.on("messageCreate", async message => {
  if (message.content === "!team8") {

    // 初期化
    team8Settings.mode = null;
    team8Settings.charger = null;
    team8Settings.range = null;

    const modeMenu = new StringSelectMenuBuilder()
      .setCustomId("team8Mode")
      .setPlaceholder("抽選方法を選んでください")
      .addOptions([
        { label: "通常抽選", value: "normal" },
        { label: "武器種で抽選", value: "type" },
        { label: "サブで抽選", value: "sub" },
        { label: "スペシャルで抽選", value: "special" }
      ]);

    const row1 = new ActionRowBuilder().addComponents(modeMenu);

    await message.reply({
      content: "抽選方法を選んでください：",
      components: [row1]
    });
  }
});

// ---------------------------
// interactionCreate
// ---------------------------
client.on("interactionCreate", async interaction => {

  if (!interaction.isStringSelectMenu()) return;

  // 抽選方法を選んだ瞬間に武器一覧を読み込む（高速化の要）
  if (
    interaction.customId === "team4Mode" ||
    interaction.customId === "team8Mode" ||
    interaction.customId === "soloMode"
  ) {
    try {
      globalThis.cachedWeapons = await getWeaponsCached();
    } catch (e) {
      console.error("武器一覧取得エラー:", e);
      return interaction.reply({
        content: "武器一覧の取得に失敗しました。",
        ephemeral: true
      });
    }
  }

  // ============================================================
  // 4人用
  // ============================================================

  if (interaction.customId === "team4Mode") {
    team4Settings.mode = interaction.values[0];
    const weapons = globalThis.cachedWeapons;

    if (team4Settings.mode === "normal") {

      const chargerMenu = new StringSelectMenuBuilder()
        .setCustomId("team4ChargerLimit")
        .setPlaceholder("チャージャー制限")
        .addOptions([
          { label: "OFF（無制限）", value: "off" },
          { label: "ON（1つまで）", value: "on" }
        ]);

      const rangeMenu = new StringSelectMenuBuilder()
        .setCustomId("team4RangeLimit")
        .setPlaceholder("長射程制限")
        .addOptions([
          { label: "OFF（無制限）", value: "off" },
          { label: "ON（2つまで）", value: "on" }
        ]);

      return interaction.reply({
        content: "制限を選んでください：",
        components: [
          new ActionRowBuilder().addComponents(chargerMenu),
          new ActionRowBuilder().addComponents(rangeMenu)
        ],
        ephemeral: true
      });
    }

    // 条件抽選（type / sub / special）
    let list = [];
    let nextId = "";

    if (team4Settings.mode === "type") {
      list = [...new Set(weapons.map(w => w.type))];
      nextId = "team4Type";
    } else if (team4Settings.mode === "sub") {
      list = [...new Set(weapons.map(w => w.sub))];
      nextId = "team4Sub";
    } else if (team4Settings.mode === "special") {
      list = [...new Set(weapons.map(w => w.special))];
      nextId = "team4Special";
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(nextId)
      .setPlaceholder("条件を選んでください")
      .addOptions(list.map(v => ({ label: v, value: v })));

    return interaction.reply({
      content: "条件を選んでください：",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  // チャージャー制限
  if (interaction.customId === "team4ChargerLimit") {
    team4Settings.charger = interaction.values[0];
    return interaction.reply({
      content: `チャージャー制限：${team4Settings.charger}`,
      ephemeral: true
    });
  }

  // 長射程制限 → 結果を出すので deferReply
  if (interaction.customId === "team4RangeLimit") {
    team4Settings.range = interaction.values[0];

    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;

    const team = pickWithLimit(
      weapons,
      4,
      team4Settings.charger,
      team4Settings.range
    );

    let text = "【通常抽選 4人（制限適用）】\n";
    team.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    return interaction.editReply(text);
  }

  // 条件抽選：武器種
  if (interaction.customId === "team4Type") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.type === selected);

    const team = pickWithLimit(filtered, 4, "off", "off");

    let text = `【武器種「${selected}」4人】\n`;
    team.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    return interaction.editReply(text);
  }

  // 条件抽選：サブ
  if (interaction.customId === "team4Sub") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.sub === selected);

    const team = pickWithLimit(filtered, 4, "off", "off");

    let text = `【サブ「${selected}」4人】\n`;
    team.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    return interaction.editReply(text);
  }

  // 条件抽選：スペシャル
  if (interaction.customId === "team4Special") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.special === selected);

    const team = pickWithLimit(filtered, 4, "off", "off");

    let text = `【スペシャル「${selected}」4人】\n`;
    team.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    return interaction.editReply(text);
  }

  // ============================================================
  // 8人用（同じ構造）
  // ============================================================

  if (interaction.customId === "team8Mode") {
    team8Settings.mode = interaction.values[0];
    const weapons = globalThis.cachedWeapons;

    if (team8Settings.mode === "normal") {

      const chargerMenu = new StringSelectMenuBuilder()
        .setCustomId("team8ChargerLimit")
        .setPlaceholder("チャージャー制限")
        .addOptions([
          { label: "OFF（無制限）", value: "off" },
          { label: "ON（1つまで）", value: "on" }
        ]);

      const rangeMenu = new StringSelectMenuBuilder()
        .setCustomId("team8RangeLimit")
        .setPlaceholder("長射程制限")
        .addOptions([
          { label: "OFF（無制限）", value: "off" },
          { label: "ON（2つまで）", value: "on" }
        ]);

      return interaction.reply({
        content: "制限を選んでください：",
        components: [
          new ActionRowBuilder().addComponents(chargerMenu),
          new ActionRowBuilder().addComponents(rangeMenu)
        ],
        ephemeral: true
      });
    }

    // 条件抽選（type / sub / special）
    let list = [];
    let nextId = "";

    if (team8Settings.mode === "type") {
      list = [...new Set(weapons.map(w => w.type))];
      nextId = "team8Type";
    } else if (team8Settings.mode === "sub") {
      list = [...new Set(weapons.map(w => w.sub))];
      nextId = "team8Sub";
    } else if (team8Settings.mode === "special") {
      list = [...new Set(weapons.map(w => w.special))];
      nextId = "team8Special";
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(nextId)
      .setPlaceholder("条件を選んでください")
      .addOptions(list.map(v => ({ label: v, value: v })));

    return interaction.reply({
      content: "条件を選んでください：",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  // チャージャー制限
  if (interaction.customId === "team8ChargerLimit") {
    team8Settings.charger = interaction.values[0];
    return interaction.reply({
      content: `チャージャー制限：${team8Settings.charger}`,
      ephemeral: true
    });
  }

  // 長射程制限 → 結果
  if (interaction.customId === "team8RangeLimit") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;

    const teamA = pickWithLimit(weapons, 4, team8Settings.charger, team8Settings.range);
    const teamB = pickWithLimit(weapons, 4, team8Settings.charger, team8Settings.range);

    let text = "【通常抽選 8人（4人×2チーム）】\n\n";

    text += "=== アルファチーム ===\n";
    teamA.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    text += "\n=== ブラボーチーム ===\n";
    teamB.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    return interaction.editReply(text);
  }

  // 条件抽選：武器種
  if (interaction.customId === "team8Type") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.type === selected);

    const teamA = pickWithLimit(filtered, 4, team8Settings.charger, team8Settings.range);
    const teamB = pickWithLimit(filtered, 4, team8Settings.charger, team8Settings.range);

    let text = `【武器種「${selected}」 8人（4人×2チーム）】\n\n`;

    text += "=== アルファチーム ===\n";
    teamA.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    text += "\n=== ブラボーチーム ===\n";
    teamB.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    return interaction.editReply(text);
  }

  // 条件抽選：サブ
  if (interaction.customId === "team8Sub") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.sub === selected);

    const teamA = pickWithLimit(filtered, 4, team8Settings.charger, team8Settings.range);
    const teamB = pickWithLimit(filtered, 4, team8Settings.charger, team8Settings.range);

    let text = `【サブ「${selected}」 8人（4人×2チーム）】\n\n`;

    text += "=== アルファチーム ===\n";
    teamA.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    text += "\n=== ブラボーチーム ===\n";
    teamB.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    return interaction.editReply(text);
  }

  // 条件抽選：スペシャル
  if (interaction.customId === "team8Special") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.special === selected);

    const teamA = pickWithLimit(filtered, 4, team8Settings.charger, team8Settings.range);
    const teamB = pickWithLimit(filtered, 4, team8Settings.charger, team8Settings.range);

    let text = `【スペシャル「${selected}」 8人（4人×2チーム）】\n\n`;

    text += "=== アルファチーム ===\n";
    teamA.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    text += "\n=== ブラボーチーム ===\n";
    teamB.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

    return interaction.editReply(text);
  }

  // ============================================================
  // 1人用（solo）
  // ============================================================

  if (interaction.customId === "soloMode") {
    const mode = interaction.values[0];
    const weapons = globalThis.cachedWeapons;

    if (mode === "normal") {
      const result = weapons[Math.floor(Math.random() * weapons.length)];
      return interaction.reply({
        content: `通常抽選：**${result.name}**`,
        ephemeral: true
      });
    }

    let list = [];
    let nextId = "";

    if (mode === "type") {
      list = [...new Set(weapons.map(w => w.type))];
      nextId = "soloType";
    } else if (mode === "sub") {
      list = [...new Set(weapons.map(w => w.sub))];
      nextId = "soloSub";
    } else if (mode === "special") {
      list = [...new Set(weapons.map(w => w.special))];
      nextId = "soloSpecial";
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(nextId)
      .setPlaceholder("条件を選んでください")
      .addOptions(list.map(v => ({ label: v, value: v })));

    return interaction.reply({
      content: "条件を選んでください：",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }

  if (interaction.customId === "soloType") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.type === selected);
    const result = filtered[Math.floor(Math.random() * filtered.length)];

    return interaction.editReply(`武器種「${selected}」：**${result.name}**`);
  }

  if (interaction.customId === "soloSub") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.sub === selected);
    const result = filtered[Math.floor(Math.random() * filtered.length)];

    return interaction.editReply(`サブ「${selected}」：**${result.name}**`);
  }

  if (interaction.customId === "soloSpecial") {
    await interaction.deferReply({ ephemeral: true });

    const weapons = globalThis.cachedWeapons;
    const selected = interaction.values[0];
    const filtered = weapons.filter(w => w.special === selected);
    const result = filtered[Math.floor(Math.random() * filtered.length)];

    return interaction.editReply(`スペシャル「${selected}」：**${result.name}**`);
  }

});

// ---------------------------
// トークン
// ---------------------------
client.login(process.env.TOKEN);
