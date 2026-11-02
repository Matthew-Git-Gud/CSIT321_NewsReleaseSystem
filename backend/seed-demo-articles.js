require("dotenv").config({ path: "./.env", quiet: true });

const pool = require("./config/database");

// These are presentation-safe sample stories, not imported real-world reporting.
// Keeping the list in a script makes it easy to repopulate a new development database.
const DEMO_ARTICLES = [
  {
    authorId: 2,
    category: "Singapore",
    title: "Neighbourhood Study Corners Open for Evening Learners",
    summary: "New shared study spaces are giving residents a quiet place to learn, revise and exchange ideas after work.",
    content: "<p>Residents can now use new study corners at selected community spaces during the evening. The initiative gives learners a calm place to read, revise and work on personal projects.</p><p>Community volunteers will also host occasional study sessions and peer-support meet-ups.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 3,
    category: "Business",
    title: "Local Hawkers Test Digital Queue System During Lunch Rush",
    summary: "A small group of food stalls is trialling a simpler ordering flow to help customers spend less time waiting.",
    content: "<p>Several neighbourhood food stalls are testing a digital queue display during peak lunch hours. Customers can view their order status while the stalls continue serving walk-in diners.</p><p>The pilot focuses on practical improvements that are easy for both stallholders and regular customers to use.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 4,
    category: "Technology",
    title: "Students Build Simple Tools for Community Garden Volunteers",
    summary: "A student team has designed lightweight digital tools to help volunteers plan watering, harvests and weekend sessions.",
    content: "<p>A group of students has built a simple planning tool for neighbourhood garden volunteers. The prototype helps organisers track upcoming tasks and share updates with the wider group.</p><p>The project shows how small digital ideas can support everyday community work.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 5,
    category: "Sports",
    title: "Eastside Runners Prepare for First Community Night Relay",
    summary: "Teams of residents are gathering for an evening relay designed to welcome runners of every experience level.",
    content: "<p>Community runners are preparing for a friendly evening relay that will bring together beginners, regular runners and volunteer marshals.</p><p>Organisers hope the event will encourage residents to meet new neighbours while staying active.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 6,
    category: "Lifestyle",
    title: "Residents Share Family Recipes at Heritage Food Workshop",
    summary: "A weekend workshop invited neighbours to exchange stories and recipes that have been passed through generations.",
    content: "<p>Residents gathered for a relaxed food workshop where they shared family recipes and memories connected to familiar dishes.</p><p>The session combined simple cooking demonstrations with conversations about preserving everyday heritage.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 7,
    category: "Business",
    title: "Small Shops Join Pilot to Reduce Single-Use Packaging",
    summary: "Independent retailers are exploring reusable packaging choices that fit naturally into their daily operations.",
    content: "<p>Several independent shops are taking part in a pilot that encourages customers to return selected reusable containers.</p><p>The businesses are sharing feedback on how the system can remain convenient while reducing unnecessary packaging.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 2,
    category: "Singapore",
    title: "Library Pop-Up Brings Reading Activities to the Park",
    summary: "Families enjoyed book exchanges, storytelling sessions and quiet reading spots at a new weekend pop-up.",
    content: "<p>A local library pop-up brought reading activities into a neighbourhood park over the weekend. Families joined short storytelling sessions and explored a small book exchange.</p><p>Organisers plan to rotate the activity through more shared spaces in the coming months.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 3,
    category: "Technology",
    title: "Young Creators Showcase Interactive Projects at Open Studio",
    summary: "Students and hobbyists presented small games, websites and prototypes during a welcoming community showcase.",
    content: "<p>Young creators shared interactive projects at an open studio event designed for people who are learning through building. Visitors could try short games, explore websites and ask questions.</p><p>The showcase highlighted a range of projects made with simple tools and lots of curiosity.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 4,
    category: "Sports",
    title: "Community Teams Set for Weekend Futsal Friendly",
    summary: "New and returning players will meet for a low-pressure tournament focused on teamwork and neighbourhood spirit.",
    content: "<p>Community futsal teams are preparing for a friendly weekend tournament. The matches are organised for players who want a relaxed way to practise and meet others.</p><p>Volunteer coaches will also run short warm-up activities for younger participants.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 5,
    category: "Lifestyle",
    title: "Volunteer Mentors Launch Monthly Career Skills Sessions",
    summary: "Residents can sign up for practical sessions covering interview preparation, portfolios and workplace communication.",
    content: "<p>A group of volunteer mentors has launched monthly sessions for residents who want to build confidence in their career skills. Each session focuses on one practical topic.</p><p>Participants can bring questions, practise short introductions and exchange useful resources with one another.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 6,
    category: "Technology",
    title: "Neighbourhood App Adds Live Updates for Community Events",
    summary: "A new event update feature helps residents check programme changes and activity timings in one place.",
    content: "<p>A neighbourhood event app has added a live update feature for local activities. Residents can now check schedule adjustments and location notes without searching through multiple announcements.</p><p>The feature was shaped by feedback from community organisers and regular attendees.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 7,
    category: "Lifestyle",
    title: "Art Walk Connects Local Makers with Weekend Visitors",
    summary: "A self-guided route is helping visitors discover small studios, craft demonstrations and creative neighbourhood spaces.",
    content: "<p>A new self-guided art walk is inviting visitors to explore local studios and meet makers at their own pace. The route includes short demonstrations, small exhibits and places to pause.</p><p>Participants can collect a simple map from the community centre before setting out.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 2,
    category: "Singapore",
    title: "Green Roof Project Starts at Community Centre",
    summary: "Residents and volunteers have begun planting a rooftop space that will support small workshops and shared learning.",
    content: "<p>Work has started on a small green roof project at a community centre. The space will include easy-to-care-for plants and areas for short gardening workshops.</p><p>Residents are invited to join future planting days and help shape the activities planned for the space.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 3,
    category: "Business",
    title: "Independent Cafes Collaborate on Reusable Cup Return Points",
    summary: "Neighbourhood cafes are trying a shared return system to make reusable cup choices more convenient for regular customers.",
    content: "<p>A small group of independent cafes is testing shared return points for reusable cups. Customers can return a cup at any participating location after finishing their drink.</p><p>The collaboration is designed to make a low-waste option easier to use during busy everyday routines.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
  {
    authorId: 4,
    category: "World",
    title: "Cities Exchange Ideas on Designing More Walkable Public Spaces",
    summary: "Urban planners and community groups shared practical examples of streets, parks and crossings designed for everyday use.",
    content: "<p>Representatives from several cities met to exchange ideas on more walkable public spaces. Discussions focused on small improvements that can make streets safer and more welcoming.</p><p>Examples included shaded routes, clearer crossings and more places for people to rest and gather.</p><p><em>Demo article created for the News Release System presentation.</em></p>",
  },
];

const LEGACY_VISIBLE_MARKER =
  "<p><em>Demo article created for the News Release System presentation.</em></p>";
const SEED_MARKER = "<!-- news-release-system-demo -->";
const SAMPLE_AUTHOR_ID = 9;

// Reuse six local editorial covers so every seeded story has a relevant image
// without relying on an external image host during a presentation.
const CATEGORY_COVER_IMAGES = {
  Singapore: "singapore-community.png",
  Business: "business-local.png",
  Technology: "technology-students.png",
  Sports: "sports-running.png",
  Lifestyle: "lifestyle-garden.png",
  World: "world-coastal-city.png",
};

for (const article of DEMO_ARTICLES) {
  // Keep all presentation stories under yy's account so they can be edited
  // through the normal "My Articles" screen without affecting real accounts.
  article.authorId = SAMPLE_AUTHOR_ID;

  // The internal marker is invisible in the article reader, unlike the old demo label.
  article.content = article.content.replace(LEGACY_VISIBLE_MARKER, SEED_MARKER);

  // This image is also picked up as the cover on article-listing pages.
  const coverImage = CATEGORY_COVER_IMAGES[article.category];
  article.content = `<figure class="image article-seed-cover"><img src="/article-covers/${coverImage}" alt="" /></figure>${article.content}`;
}

async function seedDemoArticles() {
  let inserted = 0;
  let refreshed = 0;
  let skipped = 0;

  for (const article of DEMO_ARTICLES) {
    const [result] = await pool.execute(
      `INSERT INTO articles (author_id, category_id, title, summary, content, status)
       SELECT ?, category_id, ?, ?, ?, 'published'
       FROM categories
       WHERE name = ?
         AND NOT EXISTS (
           SELECT 1 FROM articles WHERE title = ?
         )`,
      [
        article.authorId,
        article.title,
        article.summary,
        article.content,
        article.category,
        article.title,
      ],
    );

    if (result.affectedRows === 1) {
      inserted += 1;
      continue;
    }

    // Upgrade only our earlier seeded copies which do not yet have a cover.
    // This preserves any article a teammate has manually edited.
    const [updated] = await pool.execute(
      `UPDATE articles
       SET author_id = ?,
           category_id = (SELECT category_id FROM categories WHERE name = ? LIMIT 1),
           summary = IF(content LIKE '%article-seed-cover%', summary, ?),
           content = IF(content LIKE '%article-seed-cover%', content, ?)
       WHERE title = ?
         AND content LIKE ?
         AND (content NOT LIKE '%article-seed-cover%' OR author_id <> ?)`,
      [
        article.authorId,
        article.category,
        article.summary,
        article.content,
        article.title,
        "%news-release-system-demo%",
        article.authorId,
      ],
    );

    if (updated.affectedRows === 1) refreshed += 1;
    else skipped += 1;
  }

  console.log(`Demo article seed complete: ${inserted} inserted, ${refreshed} refreshed, ${skipped} unchanged.`);
}

seedDemoArticles()
  .catch((error) => {
    console.error("Unable to seed demo articles:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
