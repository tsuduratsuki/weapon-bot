require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const { getWeaponsCached } = require("./utils/getWeaponsCached");
const { pickWithLimit } = require("./utils/pickWithLimit");
const { pickByRule } = require("./pickByRule");

// 設定
globalThis.soloSettings  = { mode: "", filter: "" };
globalThis.team4Settings = { mode: "", filter: "", charger: "off", range: "off" };
globalThis.team8Settings = { mode: "", filter: "", charger: "off", range: "off" };

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ---------------------------
// コマンド読み込み
// ---------------------------
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async () => {
  console.log("Bot Ready!");
  globalThis.cachedWeapons = await getWeaponsCached(); // 起動時に一度だけ読み込む
});

// ---------------------------
// InteractionCreate
// ---------------------------
client.on(Events.InteractionCreate, async interaction => {

  const weapons = globalThis.cachedWeapons;

  // スラッシュコマンド
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (e) {
      // 壊れた interaction を完全に無視
    }

    return;
  }

  // メニュー（update）
  if (interaction.isStringSelectMenu()) {

    const safeUpdate = async (data) => {
      try {
        await interaction.update(data);
      } catch (e) {
        return;
      }
    };

    // ============================================================
    // SOLO：モード選択
    // ============================================================
    if (interaction.customId === "soloMode") {
      const mode = interaction.values[0];
      soloSettings.mode = mode;

      if (mode === "normal") {
        const result = weapons[Math.floor(Math.random() * weapons.length)];
        return safeUpdate({
          content: `🎯 ソロ抽選結果：**${result.name}**`,
          components: []
        });
      }

      const key = mode;
      const list = [...new Set(weapons.map(w => w[key]))];

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`solo_${key}`)
        .setPlaceholder(`${key} を選んでください`)
        .addOptions(list.map(v => ({ label: v, value: v })));

      return safeUpdate({
        content: `${key} を選んでください：`,
        components: [new ActionRowBuilder().addComponents(menu)]
      });
    }

    // ============================================================
    // SOLO：フィルタ選択
    // ============================================================
    else if (
      interaction.customId === "solo_type" ||
      interaction.customId === "solo_sub" ||
      interaction.customId === "solo_special"
    ) {
      const filter = interaction.values[0];

      let pool = [...weapons];

      if (interaction.customId === "solo_type") {
        pool = pool.filter(w => w.type === filter);
      } else if (interaction.customId === "solo_sub") {
        pool = pool.filter(w => w.sub === filter);
      } else if (interaction.customId === "solo_special") {
        pool = pool.filter(w => w.special === filter);
      }

      const result = pool[Math.floor(Math.random() * pool.length)];

      return safeUpdate({
        content: `🎯 ソロ抽選結果：**${result.name}**`,
        components: []
      });
    }

    // ============================================================
    // TEAM4：モード選択
    // ============================================================
    else if (interaction.customId === "team4Mode_v2") {
      const mode = interaction.values[0];
      team4Settings.mode = mode;

      if (mode === "normal") {
        const ruleMenu = new StringSelectMenuBuilder()
          .setCustomId("team4Rule_v2")
          .setPlaceholder("ルールを選んでください")
          .addOptions([
            { label: "ガチエリア", value: "area" },
            { label: "ガチヤグラ", value: "yagura" },
            { label: "ガチホコバトル", value: "hoko" },
            { label: "ガチアサリ", value: "asari" }
          ]);

        return safeUpdate({
          content: "ルールを選んでください：",
          components: [new ActionRowBuilder().addComponents(ruleMenu)]
        });
      }

      const key = mode;
      const list = [...new Set(weapons.map(w => w[key]))];

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`team4_${key}`)
        .setPlaceholder(`${key} を選んでください`)
        .addOptions(list.map(v => ({ label: v, value: v })));

      return safeUpdate({
        content: `${key} を選んでください：`,
        components: [new ActionRowBuilder().addComponents(menu)]
      });
    }

    // ============================================================
    // TEAM4：normal → ルール選択
    // ============================================================
    else if (interaction.customId === "team4Rule_v2") {
      const rule = interaction.values[0];

      const alpha = pickByRule(weapons, 4, rule);

      let text = `【4人用抽選結果】（${rule}）\n\n`;
      alpha.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

      return safeUpdate({ content: text, components: [] });
    }

    // ============================================================
    // TEAM4：フィルタ選択
    // ============================================================
    else if (
  interaction.customId === "team4_type" ||
  interaction.customId === "team4_sub" ||
  interaction.customId === "team4_special"
) {
  if (team4Settings.mode === "normal") {
    // ★ ここを削除する
    // return;
  }

  const filter = interaction.values[0];

  let pool = [...weapons];

  if (interaction.customId === "team4_type") {
    pool = pool.filter(w => w.type === filter);
  } else if (interaction.customId === "team4_sub") {
    pool = pool.filter(w => w.sub === filter);
  } else if (interaction.customId === "team4_special") {
    pool = pool.filter(w => w.special === filter);
  }

  const alpha = pickWithLimit(pool, 4, "off", "off");

  let text = `【4人用抽選結果】\n\n`;
  alpha.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

  return safeUpdate({
    content: text,
    components: []
  });
}

    // ============================================================
    // TEAM8：モード選択
    // ============================================================
    else if (interaction.customId === "team8Mode") {
      const mode = interaction.values[0];
      team8Settings.mode = mode;

      if (mode === "normal") {
        const ruleMenu = new StringSelectMenuBuilder()
          .setCustomId("team8Rule")
          .setPlaceholder("ルールを選んでください")
          .addOptions([
            { label: "ガチエリア", value: "area" },
            { label: "ガチヤグラ", value: "yagura" },
            { label: "ガチホコバトル", value: "hoko" },
            { label: "ガチアサリ", value: "asari" }
          ]);

        return safeUpdate({
          content: "ルールを選んでください：",
          components: [new ActionRowBuilder().addComponents(ruleMenu)]
        });
      }

      const key = mode;
      const list = [...new Set(weapons.map(w => w[key]))];

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`team8_${key}`)
        .setPlaceholder(`${key} を選んでください`)
        .addOptions(list.map(v => ({ label: v, value: v })));

      return safeUpdate({
        content: `${key} を選んでください：`,
        components: [new ActionRowBuilder().addComponents(menu)]
      });
    }

    // ============================================================
    // TEAM8：フィルタ選択
    // ============================================================
    else if (
      interaction.customId === "team8_type" ||
      interaction.customId === "team8_sub" ||
      interaction.customId === "team8_special"
    ) {
      const filter = interaction.values[0];

      let pool = [...weapons];

      if (interaction.customId === "team8_type") {
        pool = pool.filter(w => w.type === filter);
      } else if (interaction.customId === "team8_sub") {
        pool = pool.filter(w => w.sub === filter);
      } else if (interaction.customId === "team8_special") {
        pool = pool.filter(w => w.special === filter);
      }

      const alpha = pickWithLimit(pool, 4, "off", "off");
      const bravo = pickWithLimit(pool, 4, "off", "off");

      let text = `【8人用抽選結果】\n\n`;

      text += `▼ アルファチーム\n`;
      alpha.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

      text += `\n▼ ブラボーチーム\n`;
      bravo.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

      return safeUpdate({
        content: text,
        components: []
      });
    }

    // ============================================================
    // TEAM8：normal → ルール選択 → 抽選
    // ============================================================
    else if (interaction.customId === "team8Rule") {
      const rule = interaction.values[0];

      const alpha = pickWithLimit(weapons, 4, "off", "off");
      const bravo = pickWithLimit(weapons, 4, "off", "off");

      let text = `【8人用抽選結果（${rule}）】\n\n`;

      text += `▼ アルファチーム\n`;
      alpha.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

      text += `\n▼ ブラボーチーム\n`;
      bravo.forEach((w, i) => text += `${i + 1}人目：**${w.name}**\n`);

      return safeUpdate({
        content: text,
        components: []
      });
    }

  } // ← ★ interaction.isStringSelectMenu() の閉じ

});

// ---------------------------
// ログイン
// ---------------------------
client.login(process.env.TOKEN);
