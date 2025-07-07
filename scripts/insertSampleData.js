require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import models
const Team = require("../models/team");
const Member = require("../models/member");
const Player = require("../models/player");

// Connect to MongoDB
const URI = process.env.MONGO_URI;
console.log("🔗 Connecting to:", URI);

async function insertSampleData() {
  try {
    console.log("🚀 Starting data insertion...");

    await mongoose.connect(URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    const teamCount = await Team.countDocuments();
    const memberCount = await Member.countDocuments();
    const playerCount = await Player.countDocuments();

    console.log(
      `Current data - Teams: ${teamCount}, Members: ${memberCount}, Players: ${playerCount}`
    );

    await Team.deleteMany({});
    await Member.deleteMany({});
    await Player.deleteMany({});
    console.log("✅ Cleared existing data");

    // Insert Teams
    console.log("📝 Inserting teams...");
    const teamsData = [
      { teamName: "Manchester United" },
      { teamName: "Liverpool" },
      { teamName: "Chelsea" },
      { teamName: "Arsenal" },
      { teamName: "Manchester City" },
      { teamName: "Tottenham Hotspur" },
      { teamName: "Newcastle United" },
      { teamName: "Brighton & Hove Albion" },
      { teamName: "Aston Villa" },
      { teamName: "West Ham United" },
    ];

    const teams = await Team.insertMany(teamsData);
    console.log("✅ Teams inserted:", teams.length);
    teams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.teamName} (ID: ${team._id})`);
    });

    // Insert Members with hashed passwords
    console.log("👥 Inserting members...");
    const hashedPassword = await bcrypt.hash("123456", 10);
    console.log("🔐 Password hashed successfully");

    const membersData = [
      {
        membername: "admin",
        password: hashedPassword,
        name: "Admin User",
        YOB: 1990,
        isAdmin: true,
      },
      {
        membername: "john_doe",
        password: hashedPassword,
        name: "John Doe",
        YOB: 1995,
        isAdmin: false,
      },
      {
        membername: "jane_smith",
        password: hashedPassword,
        name: "Jane Smith",
        YOB: 1992,
        isAdmin: false,
      },
      {
        membername: "mike_wilson",
        password: hashedPassword,
        name: "Mike Wilson",
        YOB: 1988,
        isAdmin: false,
      },
      {
        membername: "sarah_johnson",
        password: hashedPassword,
        name: "Sarah Johnson",
        YOB: 1993,
        isAdmin: false,
      },
      {
        membername: "alex_brown",
        password: hashedPassword,
        name: "Alex Brown",
        YOB: 1991,
        isAdmin: false,
      },
      {
        membername: "emma_davis",
        password: hashedPassword,
        name: "Emma Davis",
        YOB: 1994,
        isAdmin: false,
      },
      {
        membername: "david_lee",
        password: hashedPassword,
        name: "David Lee",
        YOB: 1989,
        isAdmin: false,
      },
      {
        membername: "lisa_garcia",
        password: hashedPassword,
        name: "Lisa Garcia",
        YOB: 1996,
        isAdmin: false,
      },
      {
        membername: "kevin_martinez",
        password: hashedPassword,
        name: "Kevin Martinez",
        YOB: 1987,
        isAdmin: false,
      },
    ];

    const members = await Member.insertMany(membersData);
    console.log("✅ Members inserted:", members.length);
    members.forEach((member, index) => {
      console.log(
        `   ${index + 1}. ${member.membername} - ${member.name} (Admin: ${
          member.isAdmin
        })`
      );
    });

    // Insert Players with Premier League official images
    console.log("⚽ Inserting players...");
    const playersData = [
      // Manchester United Players
      {
        playerName: "Cristiano Ronaldo",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/14937.png",
        cost: 200000000,
        isCaptain: false,
        information:
          "Portuguese forward, five-time Ballon d'Or winner and one of the greatest players of all time.",
        team: teams[0]._id,
        comments: [],
      },
      {
        playerName: "Marcus Rashford",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p176297.png",
        cost: 85000000,
        isCaptain: false,
        information:
          "English forward known for his pace and finishing ability. A product of Manchester United's youth academy.",
        team: teams[0]._id,
        comments: [],
      },
      {
        playerName: "Bruno Fernandes",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p141746.png",
        cost: 100000000,
        isCaptain: true,
        information:
          "Portuguese midfielder and captain. Excellent playmaker with great passing and shooting abilities.",
        team: teams[0]._id,
        comments: [],
      },
      {
        playerName: "Harry Maguire",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/95658.png",
        cost: 80000000,
        isCaptain: false,
        information:
          "English centre-back with strong aerial ability and leadership qualities.",
        team: teams[0]._id,
        comments: [],
      },
      {
        playerName: "Casemiro",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p51940.png",
        cost: 75000000,
        isCaptain: false,
        information:
          "Brazilian defensive midfielder, excellent at breaking up play and distributing the ball.",
        team: teams[0]._id,
        comments: [],
      },

      // Liverpool Players
      {
        playerName: "Mohamed Salah",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p118748.png",
        cost: 120000000,
        isCaptain: false,
        information:
          "Egyptian winger/forward, one of the best players in the world with incredible goal-scoring record.",
        team: teams[1]._id,
        comments: [],
      },
      {
        playerName: "Virgil van Dijk",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p97032.png",
        cost: 95000000,
        isCaptain: true,
        information:
          "Dutch centre-back and captain. Considered one of the best defenders in the world.",
        team: teams[1]._id,
        comments: [],
      },
      {
        playerName: "Darwin Núñez",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/447203.png",
        cost: 90000000,
        isCaptain: false,
        information:
          "Uruguayan striker with exceptional pace and finishing ability.",
        team: teams[1]._id,
        comments: [],
      },
      {
        playerName: "Luis Díaz",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/244731.png",
        cost: 85000000,
        isCaptain: false,
        information:
          "Colombian winger with excellent dribbling skills and creativity.",
        team: teams[1]._id,
        comments: [],
      },
      {
        playerName: "Alisson",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p116535.png",
        cost: 70000000,
        isCaptain: false,
        information:
          "Brazilian goalkeeper, one of the best shot-stoppers in world football.",
        team: teams[1]._id,
        comments: [],
      },

      // Chelsea Players
      {
        playerName: "Enzo Fernández",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/448047.png",
        cost: 110000000,
        isCaptain: true,
        information:
          "Argentine midfielder with exceptional passing range and vision.",
        team: teams[2]._id,
        comments: [],
      },
      {
        playerName: "Christopher Nkunku",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/213198.png",
        cost: 95000000,
        isCaptain: false,
        information:
          "French forward/attacking midfielder with great versatility and technical skills.",
        team: teams[2]._id,
        comments: [],
      },
      {
        playerName: "Thiago Silva",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/51090.png",
        cost: 45000000,
        isCaptain: false,
        information:
          "Brazilian centre-back with vast experience and leadership qualities.",
        team: teams[2]._id,
        comments: [],
      },
      {
        playerName: "Raheem Sterling",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/103955.png",
        cost: 80000000,
        isCaptain: false,
        information: "English winger with pace and direct running style.",
        team: teams[2]._id,
        comments: [],
      },
      {
        playerName: "Moisés Caicedo",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/486672.png",
        cost: 115000000,
        isCaptain: false,
        information:
          "Ecuadorian defensive midfielder with excellent ball-winning abilities.",
        team: teams[2]._id,
        comments: [],
      },

      // Arsenal Players
      {
        playerName: "Bukayo Saka",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p223340.png",
        cost: 100000000,
        isCaptain: false,
        information:
          "English winger with excellent pace, crossing ability and versatility.",
        team: teams[3]._id,
        comments: [],
      },
      {
        playerName: "Martin Ødegaard",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/184029.png",
        cost: 85000000,
        isCaptain: true,
        information:
          "Norwegian attacking midfielder and captain with excellent vision and passing.",
        team: teams[3]._id,
        comments: [],
      },
      {
        playerName: "Gabriel Jesus",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p177815.png",
        cost: 75000000,
        isCaptain: false,
        information:
          "Brazilian striker with good movement and finishing in the box.",
        team: teams[3]._id,
        comments: [],
      },
      {
        playerName: "Declan Rice",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/204480.png",
        cost: 105000000,
        isCaptain: false,
        information:
          "English defensive midfielder with excellent passing and leadership qualities.",
        team: teams[3]._id,
        comments: [],
      },
      {
        playerName: "William Saliba",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/462424.png",
        cost: 70000000,
        isCaptain: false,
        information:
          "French centre-back with pace, strength and excellent defensive positioning.",
        team: teams[3]._id,
        comments: [],
      },

      // Manchester City Players
      {
        playerName: "Erling Haaland",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/223094.png",
        cost: 150000000,
        isCaptain: false,
        information:
          "Norwegian striker with incredible goal-scoring ability and physical presence.",
        team: teams[4]._id,
        comments: [],
      },
      {
        playerName: "Kevin De Bruyne",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p61366.png",
        cost: 110000000,
        isCaptain: true,
        information:
          "Belgian midfielder and captain, one of the best playmakers in world football.",
        team: teams[4]._id,
        comments: [],
      },
      {
        playerName: "Phil Foden",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/209244.png",
        cost: 95000000,
        isCaptain: false,
        information:
          "English attacking midfielder/winger with excellent technical skills and vision.",
        team: teams[4]._id,
        comments: [],
      },
      {
        playerName: "Rodri",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/220566.png",
        cost: 85000000,
        isCaptain: false,
        information:
          "Spanish defensive midfielder, key to City's possession-based style.",
        team: teams[4]._id,
        comments: [],
      },
      {
        playerName: "Jack Grealish",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/114283.png",
        cost: 100000000,
        isCaptain: false,
        information:
          "English winger with excellent dribbling skills and creativity.",
        team: teams[4]._id,
        comments: [],
      },

      // Tottenham Hotspur Players
      {
        playerName: "Son Heung-min",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/85971.png",
        cost: 95000000,
        isCaptain: true,
        information:
          "South Korean winger/forward with great pace and two-footed finishing ability.",
        team: teams[5]._id,
        comments: [],
      },
      {
        playerName: "James Maddison",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/172780.png",
        cost: 80000000,
        isCaptain: false,
        information:
          "English attacking midfielder with excellent set-piece delivery and creativity.",
        team: teams[5]._id,
        comments: [],
      },
      {
        playerName: "Harry Kane (Former)",
        image:
          "https://resources.premierleague.com/premierleague/photos/players/250x250/p78830.png",
        cost: 120000000,
        isCaptain: false,
        information:
          "Former Tottenham captain and striker, now at Bayern Munich. Clinical finisher and playmaker.",
        team: teams[5]._id,
        comments: [],
      },
      {
        playerName: "Richarlison",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/212319.png",
        cost: 75000000,
        isCaptain: false,
        information: "Brazilian forward with pace, power and aerial ability.",
        team: teams[5]._id,
        comments: [],
      },
      {
        playerName: "Yves Bissouma",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/227127.png",
        cost: 35000000,
        isCaptain: false,
        information:
          "Malian defensive midfielder with excellent ball-winning and passing abilities.",
        team: teams[5]._id,
        comments: [],
      },

      // Newcastle United Players
      {
        playerName: "Alexander Isak",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/219168.png",
        cost: 70000000,
        isCaptain: false,
        information:
          "Swedish striker with pace, technical ability and clinical finishing.",
        team: teams[6]._id,
        comments: [],
      },
      {
        playerName: "Bruno Guimarães",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/208706.png",
        cost: 65000000,
        isCaptain: true,
        information:
          "Brazilian midfielder with excellent passing range and work rate.",
        team: teams[6]._id,
        comments: [],
      },
      {
        playerName: "Anthony Gordon",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/232826.png",
        cost: 45000000,
        isCaptain: false,
        information: "English winger with pace and direct running style.",
        team: teams[6]._id,
        comments: [],
      },
      {
        playerName: "Callum Wilson",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/75115.png",
        cost: 35000000,
        isCaptain: false,
        information:
          "English striker with good movement and finishing ability.",
        team: teams[6]._id,
        comments: [],
      },
      {
        playerName: "Sven Botman",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/220237.png",
        cost: 40000000,
        isCaptain: false,
        information:
          "Dutch centre-back with strong aerial ability and composure.",
        team: teams[6]._id,
        comments: [],
      },

      // Brighton & Hove Albion Players
      {
        playerName: "Pervis Estupiñán",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/204214.png",
        cost: 35000000,
        isCaptain: true,
        information:
          "Brazilian forward with versatility and good technical skills.",
        team: teams[7]._id,
        comments: [],
      },
      {
        playerName: "Kaoru Mitoma",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/451340.png",
        cost: 30000000,
        isCaptain: false,
        information:
          "Japanese winger with excellent dribbling skills and pace.",
        team: teams[7]._id,
        comments: [],
      },
      {
        playerName: "Evan Ferguson",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/487117.png",
        cost: 25000000,
        isCaptain: false,
        information:
          "Irish striker with great potential and finishing ability.",
        team: teams[7]._id,
        comments: [],
      },

      // Aston Villa Players
      {
        playerName: "Ollie Watkins",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/178301.png",
        cost: 55000000,
        isCaptain: true,
        information:
          "English striker with pace, movement and clinical finishing ability.",
        team: teams[8]._id,
        comments: [],
      },
      {
        playerName: "John McGinn",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/122806.png",
        cost: 40000000,
        isCaptain: false,
        information:
          "Scottish midfielder with excellent work rate and box-to-box abilities.",
        team: teams[8]._id,
        comments: [],
      },
      {
        playerName: "Emiliano Martínez",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/98980.png",
        cost: 50000000,
        isCaptain: false,
        information:
          "Argentine goalkeeper and World Cup winner with excellent shot-stopping ability.",
        team: teams[8]._id,
        comments: [],
      },

      // West Ham United Players
      {
        playerName: "Lionel Messi",
        image: "https://www.pikpng.com/pngl/b/510-5103205_messi-png-2016.png",
        cost: 180000000,
        isCaptain: true,
        information:
          "Argentine forward and captain, eight-time Ballon d'Or winner and GOAT. Master of dribbling, passing, and free-kicks.",
        team: teams[9]._id,
        comments: [],
      },
      {
        playerName: "Jarrod Bowen",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/178186.png",
        cost: 50000000,
        isCaptain: false,
        information:
          "English winger/forward with pace and good crossing ability.",
        team: teams[9]._id,
        comments: [],
      },
      {
        playerName: "Lucas Paquetá",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/224024.png",
        cost: 60000000,
        isCaptain: false,
        information:
          "Brazilian attacking midfielder with excellent technical skills and creativity.",
        team: teams[9]._id,
        comments: [],
      },
      {
        playerName: "Michail Antonio",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/57531.png",
        cost: 35000000,
        isCaptain: false,
        information: "Jamaican striker with physical presence and versatility.",
        team: teams[9]._id,
        comments: [],
      },
      {
        playerName: "Ollie Scarles",
        image:
          "https://resources.premierleague.com/premierleague25/photos/players/110x140/536109.png",
        cost: 45000000,
        isCaptain: false,
        information:
          "Former West Ham captain, now at Arsenal. Defensive midfielder with leadership qualities.",
        team: teams[9]._id,
        comments: [],
      },
    ];

    const players = await Player.insertMany(playersData);
    console.log("✅ Players inserted:", players.length);
    players.forEach((player, index) => {
      console.log(
        `   ${index + 1}. ${player.playerName} - Team ID: ${
          player.team
        } (Captain: ${player.isCaptain})`
      );
    });

    // Add some sample comments - FIX: Only use non-admin members
    console.log("💬 Adding sample comments...");

    // Get non-admin members only
    const nonAdminMembers = members.filter((member) => !member.isAdmin);
    console.log(
      `   Found ${nonAdminMembers.length} non-admin members for comments`
    );

    // Add comments to multiple players (use first 15 players)
    const playersForComments = players.slice(0, 15);

    const commentTexts = [
      "Amazing performance! This player is absolutely incredible.",
      "One of the best players I've ever watched. Pure class!",
      "Fantastic skills and great teamwork. Always delivers!",
      "Love watching this player play, always entertaining and exciting!",
      "Consistent performer throughout the season. Very reliable!",
      "Exceptional talent with great potential for the future.",
      "Outstanding technique and vision on the field.",
      "A true professional and leader on the pitch.",
      "Incredible pace and finishing ability. Goal machine!",
      "Great dribbling skills and creativity in attack.",
      "Solid defender with excellent positioning and aerial ability.",
      "Fantastic passing range and playmaking abilities.",
      "Amazing work rate and dedication to the team.",
      "Clinical finisher with great movement in the box.",
      "Excellent goalkeeper with incredible reflexes.",
      "Versatile player who can play multiple positions effectively.",
      "Great captain material with natural leadership qualities.",
      "Promising young talent with bright future ahead.",
      "Experienced player who brings stability to the team.",
      "Dynamic midfielder with box-to-box capabilities.",
    ];

    for (let i = 0; i < playersForComments.length; i++) {
      const player = playersForComments[i];

      // Add 2-3 comments per player from different members
      const numComments = Math.floor(Math.random() * 2) + 2; // 2-3 comments

      for (let j = 0; j < numComments; j++) {
        const randomMember =
          nonAdminMembers[Math.floor(Math.random() * nonAdminMembers.length)];
        const randomRating = Math.floor(Math.random() * 3) + 1; // 1-3 rating
        const randomComment =
          commentTexts[Math.floor(Math.random() * commentTexts.length)];

        // Find the player in database and add comment
        const playerInDb = await Player.findById(player._id);

        playerInDb.comments.push({
          rating: randomRating,
          content: randomComment,
          author: randomMember._id,
        });

        await playerInDb.save();
        console.log(
          `   ✅ Comment added to ${player.playerName} by ${randomMember.name} (Rating: ${randomRating})`
        );
      }
    }

    // Final verification
    console.log("\n🔍 Final verification...");
    const finalTeamCount = await Team.countDocuments();
    const finalMemberCount = await Member.countDocuments();
    const finalPlayerCount = await Player.countDocuments();

    console.log(
      `📊 Final counts - Teams: ${finalTeamCount}, Members: ${finalMemberCount}, Players: ${finalPlayerCount}`
    );

    // Show some sample data
    console.log("\n📋 Sample data preview:");
    const sampleTeam = await Team.findOne();
    const sampleMember = await Member.findOne({ isAdmin: false });
    const samplePlayer = await Player.findOne().populate("team");
    const playerWithComments = await Player.findOne({
      "comments.0": { $exists: true },
    }).populate("comments.author", "name membername");

    console.log(`   🏆 Sample Team: ${sampleTeam.teamName}`);
    console.log(
      `   👤 Sample Member: ${sampleMember.name} (@${sampleMember.membername})`
    );
    console.log(
      `   ⚽ Sample Player: ${samplePlayer.playerName} (${samplePlayer.team.teamName})`
    );
    if (playerWithComments && playerWithComments.comments.length > 0) {
      const comment = playerWithComments.comments[0];
      console.log(
        `   💬 Sample Comment: "${comment.content}" by ${comment.author.name} (Rating: ${comment.rating})`
      );
    }

    console.log("\n🎉 === SAMPLE DATA INSERTED SUCCESSFULLY ===");
    console.log("🔐 Login credentials:");
    console.log("   👑 Admin - Username: admin, Password: 123456");
    console.log("   👤 User - Username: john_doe, Password: 123456");
    console.log("   👤 User - Username: jane_smith, Password: 123456");
    console.log("   👤 User - Username: mike_wilson, Password: 123456");
    console.log("   👤 User - Username: sarah_johnson, Password: 123456");
    console.log("   👤 User - Username: alex_brown, Password: 123456");
    console.log("   👤 User - Username: emma_davis, Password: 123456");
    console.log("   👤 User - Username: david_lee, Password: 123456");
    console.log("   👤 User - Username: lisa_garcia, Password: 123456");
    console.log("   👤 User - Username: kevin_martinez, Password: 123456");
    console.log("==========================================");

    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error inserting sample data:", error);
    console.error("Stack trace:", error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

insertSampleData();
