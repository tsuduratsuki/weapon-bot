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

// 設定オブジェクト
globalThis.team4Settings = { mode: "", charger: "off", range: "off" };
globalThis.team8Settings = { mode: "", charger: "off", range: "off" };

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

// ---------------------------
// InteractionCreate（1つに統合）
// ---------------------------
client.on(Events.InteractionCreate, async interaction => {

  // ---------------------------
  // スラッシュコマンド
  // ---------------------------
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
    }
    return;
  }

  // ---------------------------
  // メニュー
  // ---------------------------
  if (interaction.isStringSelectMenu()) {

    // 武器一覧キャッシュ
    if (
      interaction.customId === "team4Mode" ||
      interaction.customId === "team8Mode"
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
      const weapons = globalThis.cachedWeapons;
      const mode = interaction.values[0];
      team4Settings.mode = mode;

      if (mode === "normal") {
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

      let list = [];
      let nextId = "";

      if (mode === "type") {
        list = [...new Set(weapons.map(w => w.type))];
        nextId = "team4Type";
      } else if (mode === "sub") {
        list = [...new Set(weapons.map(w => w.sub))];
        nextId = "team4Sub";
      } else if (mode === "special") {
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

    if (interaction.customId === "team4ChargerLimit") {
      team4Settings.charger = interaction.values[0];
      return interaction.reply({
        content: `チャージャー制限：${team4Settings.charger}`,
        ephemeral: true
      });
    }

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

  }
});

// ---------------------------
// ログイン
// ---------------------------
client.login(process.env.TOKEN);
