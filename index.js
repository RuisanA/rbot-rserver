const http = require("http");
const {
  Client,
  Intents,
  MessageAttachment,
  MessageEmbed,
  Permissions,
  MessageActionRow,
  MessageSelectMenu,
  MessageButton,
  GatewayIntentBits,
  Guild,
  GuildMember,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Colors,
  ActivityType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  SlashCommandBuilder,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  AttachmentBuilder,
  StringSelectMenuBuilder,
  Events,
  PermissionsBitField,
  Embed,
} = require("discord.js");
const { CronJob } = require('cron');
const fs = require("fs");
const axios = require('axios');
require("dotenv").config();
const {token} = process.env;
const fetch = require("node-fetch");
const options = {
  intents: [
    "Guilds",
    "GuildBans",
    "GuildMessages",
    "GuildChannels,",
    "MessageContent",
    "GatewayIntentBits.GuildVoiceStates",
    "GatewayIntentBits.GuildMembers",
    "IntentsBitField.Flags.GuildMessages",
    "IntentsBitField.Flags.MessageContent",
    "DirectMessages",
    "DirectMessageReactions",
    "DirectMessageTyping",
    "GuildPresences",
    "Discord.Intents.FLAGS.GUILDS",
    "Discord.Intents.FLAGS.GUILD_MESSAGES",
  ],
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
});

const { serve } = require("@hono/node-server");
const healthCheckServer = require("./server");

const prefix = "r.";

client.on("ready", (message) => {
  console.log("ログインしました");
  client.user.setStatus("online");

  const words = [
    "LEVEL"
  ];

  let i = 0;
  setInterval(() => {
    client.user.setActivity(`${words[i]}`);
    i++;
    if (i > words.length - 1) {
      i = 0;
    }
  }, 1000 * 4);
});

const levelsFilePath = "levels.txt";
let levels = new Map();

let rankupChannels = new Map();
const channelsFilePath = "channels.txt";

const moneyFilePath = 'money.txt';

let coins = new Map();

const saveLevelsToFile = () => {
  fs.writeFileSync(levelsFilePath, JSON.stringify([...levels]));
};

const saveChannelsToFile = () => {
  fs.writeFileSync(channelsFilePath, JSON.stringify([...rankupChannels]));
};

const saveCoinsToFile = () => {
  fs.writeFileSync(moneyFilePath, JSON.stringify([...coins]));
};

if (!fs.existsSync(levelsFilePath)) {
  fs.writeFileSync(levelsFilePath, "[]");
} else {
  const fileContent = fs.readFileSync(levelsFilePath, "utf-8");
  if (fileContent) {
    try {
      const savedLevels = JSON.parse(fileContent);
      levels = new Map(savedLevels);
    } catch (error) {
      console.error("Error parsing levels from file:", error);
    }
  }
}

if (!fs.existsSync(channelsFilePath)) {
  fs.writeFileSync(channelsFilePath, "[]");
} else {
  const fileContent = fs.readFileSync(channelsFilePath, "utf-8");
  if (fileContent) {
    try {
      const savedChannels = JSON.parse(fileContent);
      rankupChannels = new Map(savedChannels);
    } catch (error) {
      console.error("Error parsing channels from file:", error);
    }
  }
}

if (!fs.existsSync(moneyFilePath)) {
  fs.writeFileSync(moneyFilePath, '[]');
} else {
  const fileContent = fs.readFileSync(moneyFilePath, 'utf-8');
  if (fileContent) {
    try {
      const savedCoins = JSON.parse(fileContent);
      coins = new Map(savedCoins);
    } catch (error) {
      console.error('Error parsing coins from file:', error);
    }
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const level = (await levels.get(message.author.id)) || { count: 0, level: 0 };

  const allowedUserId = "1178414826184265819";

  // コマンドの解析
  if (message.content.startsWith("r.setrank")) {
    if (!allowedUserId.includes(message.author.id)) {
      return message.reply("使用権限がありません");
    }
    const args = message.content.split(" ");
    if (args.length !== 3) {
      message.reply(
        "正しい形式でコマンドを入力してください： r.setrank @user 5"
      );
      return;
    }

    const targetUser = message.mentions.members.first();
    if (!targetUser) {
      message.reply("ユーザーが見つかりませんでした。");
      return;
    }

    const newLevel = parseInt(args[2]);
    if (isNaN(newLevel) || newLevel < 0 || newLevel > 9999) {
      message.reply("レベルは1~9999の間で設定してください。");
      return;
    }

    level.level = newLevel;
    levels.set(targetUser.id, level);

    message.reply(
      `ユーザー ${targetUser.user.tag} のレベルを ${newLevel} に設定しました。`
    );
  }

  if (message.content.startsWith("r.setxp")) {
    if (!allowedUserId.includes(message.author.id)) {
      return message.reply("使用権限がありません");
    }
    const args = message.content.split(" ");
    if (args.length !== 3) {
      message.reply(
        "正しい形式でコマンドを入力してください： r.setxp @user 50"
      );
      return;
    }

    const targetUser = message.mentions.members.first();
    if (!targetUser) {
      message.reply("ユーザーが見つかりませんでした。");
      return;
    }

    const newXp = parseInt(args[2]);
    if (isNaN(newXp) || newXp < 0) {
      message.reply("XPは正の整数で設定してください。");
      return;
    }

    level.count = newXp;
    levels.set(targetUser.id, level);

    message.reply(
      `ユーザー ${targetUser.user.tag} のXPを ${newXp} に設定しました。`
    );
  }

  level.count += Math.floor(Math.random() * 5) + 1;

  if (level.count >= 1000) {
    level.count = 0;
    level.level += 1;

    const rankupChannelId = rankupChannels.get(message.guild.id);
    const rankupChannel = client.channels.cache.get(rankupChannelId);
    
    const rankupembed = new EmbedBuilder()
    .setTitle("ランクアップ")
    .setDescription(`<@${message.author.id}>のレベルが1上がりました`)
    .setColor('Random')
    .setTimestamp();

    if (rankupChannel) {
      rankupChannel.send({
        embeds: [rankupembed]
      });
    }

    if (level.level >= 5) {
      const targetRoleId = "1137042095731916850";
      const targetRole = message.guild.roles.cache.get(targetRoleId);

      if (targetRole) {
        try {
          await message.member.roles.add(targetRoleId);
          console.log(
            `ユーザー ${message.author.tag} にロール ${targetRoleId} を付与しました。`
          );
        } catch (error) {
          console.error(`ロール ${targetRoleId} の付与に失敗しました：`, error);
        }
      } else {
        console.warn(`ロールID ${targetRoleId} が見つかりませんでした。`);
      }
    }

    if (level.level % 10 === 0) {
      // レベルが10の倍数に達したら5コイン付与
      const userId = message.author.id;
      const userCoins = coins.get(userId) || 0;
    
      coins.set(userId, userCoins + 5);
      saveCoinsToFile();
    
      const rankupbonus = new EmbedBuilder()
        .setTitle(":coin:ランクアップボーナス:coin:")
        .setDescription(`レベルが${level.level}に達したので5コインが付与されました`)
        .setColor('Yellow')
        .setTimestamp();
    
      rankupChannel.send({
        embeds: [rankupbonus]
      });
    }
  }    

  levels.set(message.author.id, level);

  const args = message.content.split(' ');
const command = args[0];

if (command === 'r.money') {
  let targetUser = message.author;

  // メンションがある場合、メンションされたユーザーを対象にする
  if (message.mentions.users.size > 0) {
    targetUser = message.mentions.users.first();
  }

  const targetUserId = targetUser.id;
  const targetUserCoins = coins.get(targetUserId) || 0;

  // 1コイン = 0.1 paypay に換算
  const paypayAmount = targetUserCoins * 0.1;

  const embed = new EmbedBuilder()
    .setTitle('コイン')
    .setDescription(`<@${targetUserId}>さんの現在の所持コイン: :coin:**${targetUserCoins}枚**\nPayPay換算: **${paypayAmount}円**`)
    .setColor('Gold')
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

if (command === 'r.nibuiti') {
  const userId = message.author.id;

  const userCoins = coins.get(userId) || 0;
  const betAmount = parseInt(args[1]);

  if (isNaN(betAmount) || betAmount <= 0 || betAmount > userCoins) {
    return message.reply('正しい形式でコマンドを入力してください： a.nibuiti ベット枚数');
  }

  // 2分の1の確率で当たりかハズレ
  const isWin = Math.random() < 0.5;

  if (isWin) {
    // 当たりの場合
    const winnings = betAmount * 2;
    coins.set(userId, userCoins + winnings - betAmount); // 払った分を差し引く
    saveCoinsToFile();

    message.reply(`おめでとうございます！当たり！ ${betAmount}枚のコインが ${winnings}枚になりました！`);
  } else {
    // ハズレの場合
    coins.set(userId, userCoins - betAmount);
    saveCoinsToFile();

    message.reply(`残念！ハズレ！ ${betAmount}枚のコインが失われました。`);
  }
}

  
  if (command === "r.rank") {
    let targetUser = message.author;

    // メンションがある場合、メンションされたユーザーを対象にする
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    }

    const targetLevel = (await levels.get(targetUser.id)) || {
      count: 0,
      level: 0,
    };

    const embed = new EmbedBuilder()
      .setTitle("ランク")
      .setDescription(
        `<@${targetUser.id}> の現在のレベル:**${
          targetLevel.level
        }**\n現在のXP:**${0 + targetLevel.count}**\n次のレベルまで **${
          1000 - targetLevel.count
        }**`
      )
      .setColor("Random")
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
  
  if (command === 'r.resetall') {
    if (!message.guild) {
      return message.reply('このコマンドはサーバー内でのみ実行できます。');
    }

    // サーバー内のすべてのユーザーのXPとレベルをリセット
    message.guild.members.cache.forEach((member) => {
      levels.set(member.user.id, { count: 0, level: 0 });
    });

    // レベル情報をtxtファイルに保存
    fs.writeFileSync(levelsFilePath, JSON.stringify([...levels]));

    message.reply('サーバー内のすべてのユーザーのXPとレベルをリセットしました。');
  }   

  if (command === 'r.allreward') {
    if (!allowedUserId.includes(message.author.id)) {
      return message.reply("使用権限がありません");
    }

    const rewardAmount = parseInt(args[1]);

    if (isNaN(rewardAmount) || rewardAmount <= 0) {
      return message.reply('正しい形式でコマンドを入力してください： r.allreward コイン枚数');
    }

    message.guild.members.cache.forEach((member) => {
      const memberId = member.user.id;
      const currentCoins = coins.get(memberId) || 0;
      coins.set(memberId, currentCoins + rewardAmount);
    });

    saveCoinsToFile();
    message.reply(`サーバー内のすべてのメンバーに ${rewardAmount} 枚のコインが付与されました。`);
  }

  if (command === 'r.allresetmoney') {
    if (!allowedUserId.includes(message.author.id)) {
      return message.reply("使用権限がありません");
    }

    message.guild.members.cache.forEach((member) => {
      const memberId = member.user.id;
      coins.set(memberId, 0);
    });

    saveCoinsToFile();
    message.reply('サーバー内のすべてのメンバーのコインをリセットしました。');
  }

  if (command === 'r.setmoney') {
    if (!message.guild) {
      return message.reply('このコマンドはサーバー内でのみ実行できます。');
    }

    if (!allowedUserId.includes(message.author.id)) {
      return message.reply("使用権限がありません");
    }

    if (args.length !== 3) {
      message.reply('正しい形式でコマンドを入力してください： a.setmoney @user 数字');
      return;
    }

    const targetUser = message.mentions.members.first();
    if (!targetUser) {
      message.reply('ユーザーが見つかりませんでした。');
      return;
    }

    const newCoins = parseInt(args[2]);
    if (isNaN(newCoins) || newCoins < 0) {
      message.reply('コインの枚数は正の整数で設定してください。');
      return;
    }

    coins.set(targetUser.id, newCoins);
    saveCoinsToFile();

    message.reply(`ユーザー ${targetUser.user.tag} のコインを ${newCoins} 枚に設定しました。`);
  }
  
  if (command === 'r.ranking') {
  const sortedLevels = [...levels.entries()].sort((a, b) => b[1].level - a[1].level);

  for (let i = 0; i < Math.min(5, sortedLevels.length); i++) {
    const [userId, userLevel] = sortedLevels[i];
    const user = await client.users.fetch(userId);

    const embed = new EmbedBuilder()
    .setTitle('レベルランキング')
    .setFields(
      { name: `${i + 1}位`, value: `<@${user.id}>`},
      { name: `LEVEL`, value: `**${userLevel.level}**`},
      { name: `XP`, value: `**${userLevel.count}**`}
    )
    .setColor('Random')
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
}
  }
  // levelsをtxtファイルに保存
  saveLevelsToFile();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("r.setuplog")) {
    const args = message.content.split(" ");
    if (args.length !== 2) {
      message.reply(
        "正しい形式でコマンドを入力してください： a.setuplog チャンネルID"
      );
      return;
    }

    const channel = client.channels.cache.get(args[1]);
    if (!channel) {
      message.reply("指定されたチャンネルが見つかりませんでした。");
      return;
    }

    rankupChannels.set(message.guild.id, args[1]);
    saveChannelsToFile();

    message.reply(
      `Rankupログが ${channel} に設定されました。\n設定をリセットする場合は\na.deletechannel ${message.guild.id} ${channel.id}\nと送信してください`
    );
  }
  if (message.content.startsWith("r.deletelog")) {
    const args = message.content.split(" ");
    if (args.length !== 3) {
      message.reply(
        "正しい形式でコマンドを入力してください： a.deletelog サーバーID チャンネルID"
      );
      return;
    }

    const guildIdToDelete = args[1];
    const channelIdToDelete = args[2];

    if (rankupChannels.has(guildIdToDelete)) {
      const channelsInGuild = rankupChannels.get(guildIdToDelete);

      // channelsInGuildがMapでない場合は新しくMapを作成
      if (!(channelsInGuild instanceof Map)) {
        rankupChannels.set(guildIdToDelete, new Map());
        saveChannelsToFile();
        message.reply(
          `サーバーID ${guildIdToDelete} のチャンネル ${channelIdToDelete} を削除しました。`
        );
        return;
      }

      if (channelsInGuild.has(channelIdToDelete)) {
        channelsInGuild.delete(channelIdToDelete);

        // もしギルド内で残りのチャンネルがなければギルドIDも削除
        if (channelsInGuild.size === 0) {
          rankupChannels.delete(guildIdToDelete);
        }

        saveChannelsToFile();
        message.reply(
          `サーバーID ${guildIdToDelete} のチャンネル ${channelIdToDelete} を削除しました。`
        );
      } else {
        message.reply(
          `指定されたチャンネルID ${channelIdToDelete} はサーバーID ${guildIdToDelete} に存在しません。`
        );
      }
    } else {
      message.reply(`指定されたサーバーID ${guildIdToDelete} は存在しません。`);
    }
  }
});

const guildId = '1133014804517367879';
const voicechannelId = '1209002009521430628';

client.on('voiceStateUpdate', (oldState, newState) => {
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(voicechannelId);

  // ユーザーがボイスチャンネルから入退室したかを確認
  if (oldState.channelId !== newState.channelId) {
    // ユーザーがボイスチャンネルから退出した場合
    if (!newState.channelId) {
      const embed = {
        title: 'ボイスチャンネル退出通知',
        description: `<@${oldState.member.user.id}> が <#${oldState.channelId}> から退出しました。`,
        timestamp: new Date(),
      };

      channel.send({ embeds: [embed] });
    }

    // ユーザーがボイスチャンネルに参加した場合
    if (newState.channelId) {
      const embed = {
        title: 'ボイスチャンネル参加通知',
        description: `<@${newState.member.user.id}> が <#${newState.channelId}> に参加しました。`,
        timestamp: new Date(),
      };

      channel.send({ embeds: [embed] });
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) {
    return;
  }

  try
  {
    console.log(`LOG(${Date()}) >> ${message.guild.toString()}にて${message.author.displayName.toString()}(name:${message.author.username.toString()} id:${message.author.id.toString()})が送信したメッセージ:\n${message.content.toString()}`);

    const overwrite = [
      {
        id: message.guild.roles.everyone,
        deny: [
          PermissionFlagsBits.SendMessages,
        ],
      },
    ];
    
    let get_log_channel = message.guild.channels.cache.find((channel) => channel.name === 'サーバーログ');
    if (!get_log_channel) {
      await message.guild.channels.create({
        name: 'サーバーログ',
        type: ChannelType.GuildText,
        permissionOverwrites: overwrite,
      });
      get_log_channel = message.guild.channels.cache.find((channel) => channel.name === 'サーバーログ');
    }

    await get_log_channel.send({
      embeds: [{
        author: {
          name: `${message.author.displayName.toString()}(${message.author.username.toString()} - ${message.author.id.toString()})`,
          icon_url: message.author.avatarURL().toString()
        },
        title: `${message.guild.toString()}の${message.channel.url.toString()}にて送信されたメッセージ`,
        description: message.content.toString(),
        color: 0x00fa9a,
        footer: {
          text: "ChatLogs | Sent time"
        },
        timestamp: new Date()
      }]
    });

    if (message.attachments.size > 0)
    {
      const files = message.attachments.toJSON();
      console.log(`LOG >> 画像${message.attachments.size.toString()}件`);
      for (let i = 0; i < message.attachments.size; i++)
      {
        await get_log_channel.send({
          embeds: [{
            title: `添付画像${(i+1).toString()}`,
            color: 0x00fa9a,
            image: {
              url: files[i].url.toString()
            },
            footer: {
              text: "ChatLogs | Sent time"
            },
            timestamp: new Date()
          }]
        });
      }
    }
  }
  catch (error)
  {
    console.error('ERR >> ', error);
  }
});

client.on(Events.MessageDelete, async message => {
  if (message.author.bot) {
    return;
  }

  try
  {
    console.log(`LOG(${Date()}) >> ${message.guild.toString()}にて${message.author.displayName.toString()}(name:${message.author.username.toString()} id:${message.author.id.toString()})が削除したメッセージ:\n${message.content.toString()}`);

    const overwrite = [
      {
        id: message.guild.roles.everyone,
        deny: [
          PermissionFlagsBits.SendMessages,
        ],
      },
    ];
    
    let get_log_channel = message.guild.channels.cache.find((channel) => channel.name === 'サーバーログ');
    if (!get_log_channel) {
      await message.guild.channels.create({
        name: 'サーバーログ',
        type: ChannelType.GuildText,
        permissionOverwrites: overwrite,
      });
      get_log_channel = message.guild.channels.cache.find((channel) => channel.name === 'サーバーログ');
    }

    await get_log_channel.send({
      embeds: [{
        author: {
          name: `${message.author.displayName.toString()}(${message.author.username.toString()} - ${message.author.id.toString()})`,
          icon_url: message.author.avatarURL().toString()
        },
        title: `${message.guild.toString()}の${message.channel.url.toString()}にて削除されたメッセージ`,
        description: message.content.toString(),
        color: 0xcd5c5c,
        footer: {
          text: "ChatLogs | Deletion time"
        },
        timestamp: new Date()
      }]
    });

    if (message.attachments.size > 0)
    {
      const files = message.attachments.toJSON();
      console.log(`LOG >> 画像${message.attachments.size.toString()}件`);
      for (let i = 0; i < message.attachments.size; i++)
      {
        await get_log_channel.send({
          embeds: [{
            title: `添付画像${(i+1).toString()}`,
            color: 0xcd5c5c,
            image: {
              url: files[i].url.toString()
            },
            footer: {
              text: "ChatLogs | Deletion time"
            },
            timestamp: new Date()
          }]
        });
      }
    }
  }
  catch (error)
  {
    console.error('ERR >> ', error);
  }
});

client.on(Events.MessageUpdate, async (before, after) => {
  if (before.author.bot || after.author.bot) {
    return;
  }

  try
  {
    console.log(`LOG(${Date()}) >> ${before.guild.toString()}にて${before.author.displayName.toString()}(name:${before.author.username.toString()} id:${before.author.id.toString()})が編集したメッセージ:\nB:: ${before.content.toString()}\nA:: ${after.content.toString()}`);
    
    const overwrite = [
      {
        id: after.guild.roles.everyone,
        deny: [
          PermissionFlagsBits.SendMessages,
        ],
      },
    ];

    let get_log_channel = before.guild.channels.cache.find((channel) => channel.name === 'サーバーログ');
    if (!get_log_channel) {
      await before.guild.channels.create({
        name: 'サーバーログ',
        type: ChannelType.GuildText,
        permissionOverwrites: overwrite,
      });
      get_log_channel = before.guild.channels.cache.find((channel) => channel.name === 'サーバーログ');
    }

    await get_log_channel.send({
      embeds: [{
        author: {
          name: `${before.author.displayName.toString()}(${before.author.username.toString()} - ${before.author.id.toString()})`,
          icon_url: before.author.avatarURL().toString()
        },
        title: `${before.guild.toString()}の${before.channel.url.toString()}にて編集されたメッセージ`,
        fields: [
          {
              name: '編集前のメッセージ',
              value: before.content.toString(),
              inline: true
          },
          {
              name: '編集済みメッセージ',
              value: after.content.toString(),
              inline: true
          }
        ],
        color: 0xf8f800,
        footer: {
          text: "ChatLogs | Edit time"
        },
        timestamp: new Date()
      }]
    });
  }
  catch (error)
  {
    console.error('ERR >> ', error);
  }
});

serve({
  fetch: healthCheckServer.fetch,
  port: 8000,
});

client.login(token);
