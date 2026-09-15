/*
  Nexus game catalogue.
  Add future games here using:
  { id: "slug", title: "Title", category: "Genre", url: "games/slug/index.html", thumb: "assets/img/slug.jpg", featured: true }
*/
const GAMES = [
  {
    id: "how-to-fish",
    title: "How to Fish",
    category: "Simulation",
    url: "games/how-to-fish/index.html",
    thumb: "assets/img/how-to-fish.jpg",
    featured: false
  },
  {
    id: "baldis-basics-plus",
    title: "Baldi's Basics Plus",
    category: "Horror",
    url: "games/baldis-basics-plus/index.html",
    thumb: "assets/img/baldis-basics-plus.jpg",
    featured: false
  },
  {
    id: "doge-miner",
    title: "Doge Miner",
    category: "Idle",
    url: "games/doge-miner/index.html",
    thumb: "assets/img/doge-miner.png",
    featured: false
  },
  {
    id: "fnaf-1",
    title: "Five Nights at Freddy's",
    category: "Horror",
    url: "games/fnaf-1/index.html",
    thumb: "assets/img/fnaf-1.jpg",
    featured: false
  },
  {
    id: "fnaf-2",
    title: "Five Nights at Freddy's 2",
    category: "Horror",
    url: "games/fnaf-2/index.html",
    thumb: "assets/img/fnaf-2.jpg",
    featured: false
  },
  {
    id: "fnaf-3",
    title: "Five Nights at Freddy's 3",
    category: "Horror",
    url: "games/fnaf-3/index.html",
    thumb: "assets/img/fnaf-3.jpg",
    featured: false
  },
  {
    id: "fnaf-4",
    title: "Five Nights at Freddy's 4",
    category: "Horror",
    url: "games/fnaf-4/index.html",
    thumb: "assets/img/fnaf-4.jpg",
    featured: false
  },
  {
    id: "fnaf-4-halloween",
    title: "Five Nights at Freddy's 4: Halloween",
    category: "Horror",
    url: "games/fnaf-4-halloween/index.html",
    thumb: "assets/img/fnaf-4-halloween.jpg",
    featured: false
  },
  {
    id: "fnaf-sister-location",
    title: "Five Nights at Freddy's: Sister Location",
    category: "Horror",
    url: "games/fnaf-sister-location/index.html",
    thumb: "assets/img/fnaf-sister-location.jpg",
    featured: false
  },
  {
    id: "fnaf-ultimate-custom-night",
    title: "Five Nights at Freddy's: Ultimate Custom Night",
    category: "Horror",
    url: "games/fnaf-ultimate-custom-night/index.html",
    thumb: "assets/img/fnaf-ultimate-custom-night.jpg",
    featured: false
  },
  {
    id: "solar-smash",
    title: "Solar Smash",
    category: "Simulation",
    url: "games/solar-smash/index.html",
    thumb: "assets/img/solar-smash.jpg",
    featured: false
  },
  {
    id: "terraria",
    title: "Terraria",
    category: "Sandbox",
    url: "games/terraria/index.html",
    thumb: "assets/img/terraria.jpg",
    featured: false
  },
  {
    id: "worldbox",
    title: "WorldBox",
    category: "Sandbox",
    url: "games/worldbox/index.html",
    thumb: "assets/img/worldbox.png",
    featured: false
  },
  {
    id: "undertale-last-breath",
    title: "Undertale: Last Breath",
    category: "Action",
    url: "games/undertale-last-breath/index.html",
    thumb: "assets/img/undertale-last-breath.png",
    featured: false
  },
  {
    id: "tabs",
    title: "Totally Accurate Battle Simulator",
    category: "Strategy",
    url: "games/tabs/index.html",
    thumb: "assets/img/tabs.png",
    featured: false
  },
  {
    id: "territorial-io",
    title: "Territorial.io",
    category: "Strategy",
    url: "games/territorial-io/index.html",
    thumb: "assets/img/territorial-io.png",
    featured: false
  },
  {
    id: "sonic-cd",
    title: "Sonic CD",
    category: "Platformer",
    url: "games/sonic-cd/index.html",
    thumb: "assets/img/sonic-cd.png",
    featured: false
  },
  {
    id: "pvz2-gardenless",
    title: "Plants vs. Zombies 2 Gardenless",
    category: "Strategy",
    url: "games/pvz2-gardenless/index.html",
    thumb: "assets/img/pvz2-gardenless.png",
    featured: false
  },
  {
    id: "plants-vs-zombies",
    title: "Plants vs. Zombies",
    category: "Strategy",
    url: "games/plants-vs-zombies/index.html",
    thumb: "assets/img/plants-vs-zombies.png",
    featured: false
  },
  {
    id: "plague-inc",
    title: "Plague Inc.",
    category: "Strategy",
    url: "games/plague-inc/index.html",
    thumb: "assets/img/plague-inc.png",
    featured: false
  },
  {
    id: "people-playground",
    title: "People Playground",
    category: "Sandbox",
    url: "games/people-playground/index.html",
    thumb: "assets/img/people-playground.png",
    featured: false
  },
  {
    id: "granny",
    title: "Granny",
    category: "Horror",
    url: "games/granny/index.html",
    thumb: "assets/img/granny.png",
    featured: false
  },
  {
    id: "gorilla-tag",
    title: "Gorilla Tag",
    category: "Action",
    url: "games/gorilla-tag/index.html",
    thumb: "assets/img/gorilla-tag.png",
    featured: false
  },
  {
    id: "fnaf-world-refreshed",
    title: "FNaF World: Refreshed",
    category: "RPG",
    url: "games/fnaf-world-refreshed/index.html",
    thumb: "assets/img/fnaf-world-refreshed.png",
    featured: false
  },
  {
    id: "bad-time-simulator",
    title: "Bad Time Simulator",
    category: "Action",
    url: "games/bad-time-simulator/index.html",
    thumb: "assets/img/bad-time-simulator.png",
    featured: false
  },
  {
    id: "minus-b",
    title: "Minus B",
    category: "Horror",
    url: "games/minus-b/index.html",
    thumb: "assets/img/minus-b.png",
    featured: false
  },
  {
    id: "ultrakill",
    title: "Ultrakill",
    category: "Shooter",
    url: "games/ultrakill/index.html",
    thumb: "assets/img/ultrakill.jpg",
    featured: false
  },
  {
    id: "minecraft",
    title: "Minecraft",
    category: "Sandbox",
    url: "games/minecraft/index.html",
    thumb: "assets/img/minecraft.webp",
    featured: false
  },
  {
    id: "angry-neighbor",
    title: "Angry Neighbor Recode",
    category: "Horror",
    url: "games/angry-neighbor/index.html",
    thumb: "assets/img/angry-neighbor.png",
    featured: true
  }
];

