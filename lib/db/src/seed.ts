import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  usersTable,
  fanGroupsTable,
  matchesTable,
  chatMessagesTable,
  forumPostsTable,
  forumRepliesTable,
  predictionsTable,
  feedPostsTable,
  feedLikesTable,
  feedCommentsTable,
} from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding FanZone database...\n");

  // ── Fan Groups ──────────────────────────────────────────────────────────────
  console.log("Creating fan groups...");
  const groups = await db
    .insert(fanGroupsTable)
    .values([
      {
        name: "Los Galácticos",
        description: "Real Madrid ultras. Hala Madrid y nada más.",
        badgeEmoji: "👑",
        badgeColor: "#FFD700",
      },
      {
        name: "The Red Army",
        description: "Manchester United supporters. Theatre of Dreams faithful.",
        badgeEmoji: "🔴",
        badgeColor: "#DA291C",
      },
      {
        name: "Barça Xavi Era",
        description: "FC Barcelona fans keeping the tiki-taka dream alive.",
        badgeEmoji: "💙",
        badgeColor: "#A50044",
      },
      {
        name: "The Kop Collective",
        description: "Liverpool FC supporters. You'll Never Walk Alone.",
        badgeEmoji: "🦅",
        badgeColor: "#C8102E",
      },
      {
        name: "Azzurri Ultras",
        description: "Italy national team and Serie A lovers united.",
        badgeEmoji: "🇮🇹",
        badgeColor: "#003399",
      },
    ])
    .returning();

  console.log(`  ✓ Created ${groups.length} fan groups`);

  // ── Bot Users ────────────────────────────────────────────────────────────────
  console.log("Creating sample users...");
  const users = await db
    .insert(usersTable)
    .values([
      { username: "GolazzoKing", bio: "Nothing beats a last-minute winner ⚽", favoriteTeam: "Real Madrid", xp: 2450, isAdmin: false, groupId: groups[0].id },
      { username: "TikiTakaToni", bio: "Possession is nine tenths of football", favoriteTeam: "Barcelona", xp: 1870, isAdmin: false, groupId: groups[2].id },
      { username: "RedDevilRaj", bio: "Old Trafford is my cathedral", favoriteTeam: "Man United", xp: 1320, isAdmin: false, groupId: groups[1].id },
      { username: "AnfieldAnna", bio: "YNWA forever 🔴", favoriteTeam: "Liverpool", xp: 3100, isAdmin: false, groupId: groups[3].id },
      { username: "CalcioCarlos", bio: "Serie A is the best league, change my mind", favoriteTeam: "AC Milan", xp: 980, isAdmin: false, groupId: groups[4].id },
      { username: "UltrasMike", bio: "Standing in the terrace since 2002", favoriteTeam: "Atletico Madrid", xp: 760, isAdmin: false, groupId: groups[0].id },
      { username: "PressBoxPaula", bio: "I predict, therefore I am", favoriteTeam: "Chelsea", xp: 540, isAdmin: false, groupId: groups[3].id },
      { username: "OffsiideTrap", bio: "It's never offside if it's a goal", favoriteTeam: "Arsenal", xp: 1150, isAdmin: false, groupId: groups[1].id },
    ])
    .returning();

  console.log(`  ✓ Created ${users.length} sample users`);

  // ── Matches ──────────────────────────────────────────────────────────────────
  console.log("Creating matches...");
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeek2 = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);

  const matches = await db
    .insert(matchesTable)
    .values([
      {
        title: "El Clásico — Champions League Quarter Final",
        description: "The biggest club fixture in football. Real Madrid host Barcelona in a pulsating Champions League quarter final. Both sides desperate for continental glory.",
        liveUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        homeTeam: "Real Madrid",
        awayTeam: "Barcelona",
        scheduledAt: now,
        status: "live",
      },
      {
        title: "Manchester Derby — Premier League",
        description: "City vs United in the Premier League. A derby that never disappoints — bragging rights and top-four implications on the line.",
        liveUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        homeTeam: "Man City",
        awayTeam: "Man United",
        scheduledAt: tomorrow,
        status: "upcoming",
      },
      {
        title: "Liverpool vs Arsenal — Premier League",
        description: "Two title contenders face off at Anfield. The Kop will be rocking as these two giants of English football battle for three crucial points.",
        liveUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        homeTeam: "Liverpool",
        awayTeam: "Arsenal",
        scheduledAt: nextWeek,
        status: "upcoming",
      },
      {
        title: "PSG vs Bayern Munich — Champions League",
        description: "French giants against German powerhouses in a cracking European night. Paris under the lights doesn't get much bigger than this.",
        liveUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        homeTeam: "PSG",
        awayTeam: "Bayern Munich",
        scheduledAt: nextWeek2,
        status: "upcoming",
      },
      {
        title: "Chelsea vs Tottenham — London Derby",
        description: "The Battle of London. Stamford Bridge hosts the North London visitors in a fierce derby that always delivers drama and controversy.",
        liveUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        homeTeam: "Chelsea",
        awayTeam: "Tottenham",
        scheduledAt: yesterday,
        status: "settled",
        homeScore: 2,
        awayScore: 1,
      },
    ])
    .returning();

  console.log(`  ✓ Created ${matches.length} matches`);

  const liveMatch = matches[0];
  const settledMatch = matches[4];

  // ── Chat Messages (for live match) ───────────────────────────────────────────
  console.log("Creating chat messages...");
  const chatMessages = [
    { matchId: liveMatch.id, userId: users[0].id, content: "LET'S GOOO! Real Madrid about to put on a masterclass 👑", createdAt: new Date(now.getTime() - 8 * 60000) },
    { matchId: liveMatch.id, userId: users[1].id, content: "Barça are going to dominate possession like they always do. Watch and learn", createdAt: new Date(now.getTime() - 7 * 60000) },
    { matchId: liveMatch.id, userId: users[3].id, content: "I'm just here for the chaos tbh 🍿", createdAt: new Date(now.getTime() - 6 * 60000) },
    { matchId: liveMatch.id, userId: users[5].id, content: "Vinicius is going to be the difference maker tonight, trust me", createdAt: new Date(now.getTime() - 5 * 60000) },
    { matchId: liveMatch.id, userId: users[1].id, content: "Pedri through the lines already! This midfield battle is incredible", createdAt: new Date(now.getTime() - 4 * 60000) },
    { matchId: liveMatch.id, userId: users[0].id, content: "Bellingham waiting for his moment. He always delivers in big games ⭐", createdAt: new Date(now.getTime() - 3 * 60000) },
    { matchId: liveMatch.id, userId: users[6].id, content: "Both keepers are going to be worked hard tonight", createdAt: new Date(now.getTime() - 2 * 60000) },
    { matchId: liveMatch.id, userId: users[2].id, content: "Can't believe I'm watching this from the sofa and not the stadium 😭", createdAt: new Date(now.getTime() - 1 * 60000) },
    { matchId: liveMatch.id, userId: users[4].id, content: "The atmosphere must be electric at the Bernabéu right now 🔥", createdAt: new Date(now.getTime() - 30000) },
  ];
  await db.insert(chatMessagesTable).values(chatMessages);
  console.log(`  ✓ Created ${chatMessages.length} chat messages`);

  // ── Forum Posts ──────────────────────────────────────────────────────────────
  console.log("Creating forum posts...");
  const forumPosts = await db
    .insert(forumPostsTable)
    .values([
      {
        matchId: liveMatch.id,
        userId: users[0].id,
        title: "Tactical breakdown: why Madrid's high press will win this",
        content: "Real Madrid's press under Ancelotti has been elite this season. They're averaging 8.2 PPDA in UCL games — that's top 3 in Europe. Tonight they'll suffocate Barça's build-up from the back. Watch how Bellingham positions himself to cut off the goalkeeper's passing lanes. This is how you win El Clásico in 2024.",
      },
      {
        matchId: liveMatch.id,
        userId: users[1].id,
        title: "Pedri is going to run this game — here's why",
        content: "People are sleeping on Pedri's development this season. His progressive carries are up 34% from last year, and his key passes per 90 are elite. Tonight he plays as a #8 not a #6 and that's the difference. When Barça have the ball in transition, Pedri will be the one unlocking the Madrid defence. Book it.",
      },
      {
        matchId: matches[1].id,
        userId: users[2].id,
        title: "Will Rashford start the Manchester Derby?",
        content: "Ten Hag has been rotating Rashford a lot lately. For a derby this big, do you think he starts? The pace he brings could be lethal on the counter against City's high line. Would love to see him and Antony linking up on the flanks.",
      },
      {
        matchId: settledMatch.id,
        userId: users[6].id,
        title: "Chelsea 2-1 Spurs: Match report and player ratings",
        content: "What a London derby! Chelsea were the better side for most of the match, with Palmer pulling the strings in midfield. Spurs had their moments — that Son equaliser was world class — but ultimately Chelsea's depth told in the second half. Palmer 9/10. Son 8/10. Gusto 7/10. A deserved win for the Blues.",
      },
    ])
    .returning();
  console.log(`  ✓ Created ${forumPosts.length} forum posts`);

  // ── Forum Replies ─────────────────────────────────────────────────────────────
  console.log("Creating forum replies...");
  await db.insert(forumRepliesTable).values([
    { postId: forumPosts[0].id, userId: users[1].id, content: "Bold take but Madrid's press can be bypassed if Lewandowski drops deep. We've seen this before." },
    { postId: forumPosts[0].id, userId: users[5].id, content: "PPDA stats don't lie. Madrid are elite at this. Great analysis 🙌" },
    { postId: forumPosts[0].id, userId: users[3].id, content: "Neither side will fully dominate — this will be decided by a moment of individual brilliance" },
    { postId: forumPosts[1].id, userId: users[0].id, content: "Pedri is good but Camavinga will follow him everywhere. Enjoy the battle 😂" },
    { postId: forumPosts[1].id, userId: users[7].id, content: "Completely agree. Pedri is the best #8 in world football right now, it's not even close" },
    { postId: forumPosts[2].id, userId: users[3].id, content: "He HAS to start. Derbies are won on intensity and Rashford brings that." },
    { postId: forumPosts[3].id, userId: users[2].id, content: "Palmer is just a different level. Spurs have no answer for him" },
    { postId: forumPosts[3].id, userId: users[4].id, content: "Son was incredible though. That volley was a 10/10 goal" },
  ]);
  console.log(`  ✓ Created forum replies`);

  // ── Predictions ───────────────────────────────────────────────────────────────
  console.log("Creating predictions...");
  await db.insert(predictionsTable).values([
    { matchId: liveMatch.id, userId: users[0].id, homeScore: 2, awayScore: 1 },
    { matchId: liveMatch.id, userId: users[1].id, homeScore: 1, awayScore: 2 },
    { matchId: liveMatch.id, userId: users[3].id, homeScore: 1, awayScore: 1 },
    { matchId: liveMatch.id, userId: users[5].id, homeScore: 3, awayScore: 1 },
    { matchId: liveMatch.id, userId: users[6].id, homeScore: 2, awayScore: 2 },
    { matchId: matches[1].id, userId: users[2].id, homeScore: 1, awayScore: 2 },
    { matchId: matches[1].id, userId: users[7].id, homeScore: 2, awayScore: 1 },
    {
      matchId: settledMatch.id, userId: users[0].id,
      homeScore: 2, awayScore: 1,
      isCorrect: true, xpAwarded: 100,
    },
    {
      matchId: settledMatch.id, userId: users[3].id,
      homeScore: 1, awayScore: 0,
      isCorrect: false, xpAwarded: 0,
    },
  ]);
  console.log(`  ✓ Created predictions`);

  // ── Feed Posts ────────────────────────────────────────────────────────────────
  console.log("Creating feed posts...");
  const feedPosts = await db
    .insert(feedPostsTable)
    .values([
      { userId: users[3].id, content: "Just renewed my Liverpool season ticket for the 8th year in a row. YNWA forever. This club owns my soul 🔴❤️", isStream: false },
      { userId: users[0].id, content: "Vinicius with another Ballon d'Or level performance. The man is just built different. Madrid faithful, we are so back 👑⚽", isStream: false },
      { userId: users[1].id, content: "Tiki-taka is dead? Tell that to Barça who just completed 847 passes vs Getafe. The philosophy lives on 💙❤️", isStream: false },
      { userId: users[4].id, content: "Hot take: Serie A is more tactically interesting than the Premier League. Change my mind. The pressing structures alone are a masterclass 🎓", isStream: false },
      { userId: users[7].id, content: "Arsenal are ready. Squad depth, fitness, and Arteta's tactics are all clicking at the perfect time. This is our year 🔴⚪", isStream: false },
      { userId: users[2].id, content: "Watching El Clásico LIVE right now — the atmosphere on stream is insane! Who else is tuned in? 🔥", isStream: false },
      { userId: users[5].id, content: "Just got my matchday shirt framed. 2014 Champions League final. The memories 😭⚽", isStream: false },
      { userId: users[6].id, content: "My prediction record this season: 14/22 correct. Not bad if I do say so myself 🎯 Who else is tracking their accuracy?", isStream: false },
    ])
    .returning();
  console.log(`  ✓ Created ${feedPosts.length} feed posts`);

  // ── Feed Likes ─────────────────────────────────────────────────────────────
  console.log("Creating feed likes & comments...");
  await db.insert(feedLikesTable).values([
    { postId: feedPosts[0].id, userId: users[2].id },
    { postId: feedPosts[0].id, userId: users[4].id },
    { postId: feedPosts[0].id, userId: users[5].id },
    { postId: feedPosts[1].id, userId: users[5].id },
    { postId: feedPosts[1].id, userId: users[3].id },
    { postId: feedPosts[2].id, userId: users[0].id },
    { postId: feedPosts[3].id, userId: users[1].id },
    { postId: feedPosts[3].id, userId: users[7].id },
    { postId: feedPosts[4].id, userId: users[3].id },
    { postId: feedPosts[4].id, userId: users[6].id },
    { postId: feedPosts[5].id, userId: users[0].id },
    { postId: feedPosts[5].id, userId: users[1].id },
    { postId: feedPosts[5].id, userId: users[3].id },
    { postId: feedPosts[7].id, userId: users[2].id },
  ]);

  // ── Feed Comments ─────────────────────────────────────────────────────────
  await db.insert(feedCommentsTable).values([
    { postId: feedPosts[0].id, userId: users[1].id, content: "YNWA! One of us ❤️" },
    { postId: feedPosts[0].id, userId: users[2].id, content: "8 years! Absolute legend. See you in the stands 🏟️" },
    { postId: feedPosts[1].id, userId: users[1].id, content: "Can't argue with that tbh. Vinicius is from another planet 👽" },
    { postId: feedPosts[2].id, userId: users[0].id, content: "847 passes and still no trophy 💀 (jk jk don't @ me)" },
    { postId: feedPosts[3].id, userId: users[1].id, content: "Hard agree actually. The defensive shape in Serie A is on another level" },
    { postId: feedPosts[3].id, userId: users[7].id, content: "Nope, Premier League every day of the week. Pace, drama, quality — unmatched" },
    { postId: feedPosts[4].id, userId: users[3].id, content: "We've been hearing 'this is our year' since 2005 😂 (but genuinely hope so!)" },
    { postId: feedPosts[7].id, userId: users[3].id, content: "14/22 is actually really solid! Mine is embarrassing 😅" },
  ]);
  console.log(`  ✓ Created feed likes and comments`);

  console.log("\n✅ Seeding complete!");
  console.log(`   ${groups.length} fan groups`);
  console.log(`   ${users.length} sample users`);
  console.log(`   ${matches.length} matches (1 live, 1 settled, 3 upcoming)`);
  console.log(`   ${chatMessages.length} live chat messages`);
  console.log(`   ${forumPosts.length} forum posts + replies`);
  console.log(`   ${feedPosts.length} feed posts + likes + comments`);
  console.log("\n🚀 Sign up and jump right into the action!");

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end();
  process.exit(1);
});
