/**
 * Enhanced story templates with detailed image descriptions for AI generation
 * These descriptions ensure character likeness is maintained while creating children's book illustrations
 */

export interface EnhancedStoryTemplate {
  id: string;
  theme: string;
  title: string;
  pages: {
    pageNumber: number;
    text: string;
    imageDescription: string;
    artStyleNotes?: string;
  }[];
}

// Common art style instructions to append to all descriptions
const COMMON_ART_STYLE = "Ensure the main character {heroName} maintains exact likeness from the source photo including age, hair color, eye color, facial features, and skin tone, but rendered in a gentle children's book illustration style. The art should be appropriate for toddlers and young children with soft edges, warm colors, and friendly expressions.";

export const ENHANCED_STORY_TEMPLATES: EnhancedStoryTemplate[] = [
  // Celebrations theme
  {
    id: 'celebrations',
    theme: 'Celebrations',
    title: "{heroName}'s Special Celebration Day",
    pages: [
      {
        pageNumber: 1,
        text: "Today was {heroName}'s special day! Balloons and decorations were everywhere.",
        imageDescription: `Illustrate {heroName} (exact likeness from source photo) standing in the center of a festively decorated room, arms spread wide with pure joy on their face. The room is filled with colorful balloons in red, yellow, blue, and green floating at different heights. Paper streamers twist from the ceiling in rainbow colors. A "Happy Celebration" banner hangs across the wall with glittery letters. Confetti dots the floor. Natural light streams through windows making everything sparkle. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Bright, celebratory children's book illustration with party atmosphere"
      },
      {
        pageNumber: 2,
        text: "{heroName} was so excited! 'I can't wait for everyone to come to my party!' said {heroName}.",
        imageDescription: `Show {heroName} (maintaining exact appearance) jumping up and down with excitement, hands clasped together, huge smile showing anticipation. They're dressed in their favorite party outfit. In the background, show a party table being set with colorful plates, cups, and a wrapped present. Through the window, show a sunny day. Capture the energy and anticipation of waiting for guests. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Dynamic, energetic illustration capturing pre-party excitement"
      },
      {
        pageNumber: 3,
        text: "Friends and family started arriving with presents and big smiles. The party was beginning!",
        imageDescription: `Depict {heroName} (exact likeness) at the front door greeting arriving guests. Show 3-4 friendly faces of different ages entering with wrapped gifts in bright paper with bows. Everyone has warm, happy expressions. {heroName} is hugging one guest while others wait their turn. The hallway is decorated with balloons tied to the doorway. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Warm, welcoming scene with diverse, friendly faces"
      },
      {
        pageNumber: 4,
        text: "Everyone played fun games together. They danced, sang songs, and laughed so much!",
        imageDescription: `Create an action-packed party scene with {heroName} (exact appearance) in the center of a circle playing musical statues, frozen in a funny pose with one leg up and arms out. Other children are also in silly frozen positions. Some are mid-laugh. Musical notes float in the air. Balloons bob with the movement. Show pure joy and fun in everyone's expressions. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Lively, movement-filled illustration with musical elements"
      },
      {
        pageNumber: 5,
        text: "Then came the most special moment - time for the birthday cake with candles!",
        imageDescription: `Show {heroName} (maintaining likeness) sitting at the head of the party table, eyes wide with wonder as a beautiful decorated cake is brought in. The cake has colorful frosting, sprinkles, and glowing candles. Everyone gathers around with excited faces. The room dims slightly to emphasize the candle glow on {heroName}'s amazed face. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Magical moment with emphasis on candlelight and anticipation"
      },
      {
        pageNumber: 6,
        text: "Oh no! A strong wind blew out all the candles before {heroName} could make a wish!",
        imageDescription: `Illustrate the moment of surprise as {heroName} (exact likeness) leans toward the cake with puffed cheeks ready to blow, but the candles are already smoking, just blown out by wind from an open window. Curtains billow dramatically. {heroName}'s expression shows surprise and disappointment. Guests look shocked. Wisps of smoke rise from the candles. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Dramatic but gentle illustration of the surprise moment"
      },
      {
        pageNumber: 7,
        text: "Everyone felt sad for a moment. But then Grandma had a wonderful idea!",
        imageDescription: `Show a wise, kind grandmother figure stepping forward with a twinkling eye and raised finger indicating an idea. {heroName} (exact appearance) looks up hopefully. Other guests turn to look at Grandma. She has a warm, reassuring smile. A thought bubble or light bulb effect above her head suggests the coming solution. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Transitional scene focusing on hope and wisdom"
      },
      {
        pageNumber: 8,
        text: "'Let's all make a wish together!' said Grandma. Everyone closed their eyes and wished.",
        imageDescription: `Beautiful scene of {heroName} (maintaining likeness) and all party guests standing in a circle around the cake, holding hands with eyes gently closed. Peaceful expressions on all faces. The unlit cake sits in the center. Soft, magical sparkles begin to appear above their heads. The scene has a quiet, powerful moment of unity and love. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Serene, magical moment emphasizing togetherness"
      },
      {
        pageNumber: 9,
        text: "Suddenly, magical sparkles appeared! Everyone's wishes were floating in the air like stars!",
        imageDescription: `Magical scene showing {heroName} (exact likeness) and guests opening their eyes in wonder as golden and silver sparkles float above them, each sparkle containing a tiny image of a wish - a toy, a hug, a sunny day, a pet, etc. The sparkles glow and dance in the air like friendly stars. {heroName} reaches up toward them with joy. The room is filled with magical light. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Fantastical, wonder-filled illustration with magical realism"
      },
      {
        pageNumber: 10,
        text: "{heroName} felt so loved and happy. The best celebration ever with the best people ever!",
        imageDescription: `Heartwarming final scene with {heroName} (exact appearance) in the center of a group hug with all the party guests. Everyone has content, loving smiles. The cake (now with re-lit candles) glows warmly on the table. Opened presents are visible. The magical sparkles from before now form a heart shape above the group. {heroName}'s face radiates pure happiness and love. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Emotional conclusion emphasizing love and belonging"
      }
    ]
  },

  // Travel theme
  {
    id: 'travel',
    theme: 'Travel',
    title: "{heroName}'s Amazing Journey",
    pages: [
      {
        pageNumber: 1,
        text: "{heroName} was packing for a big trip! Clothes, toys, and snacks went into the suitcase.",
        imageDescription: `Show {heroName} (exact likeness from source) kneeling beside an open colorful suitcase on a bedroom floor. They're carefully placing items inside: a favorite teddy bear, colorful t-shirts, shorts, a sun hat, and a small bag of snacks. Travel stickers decorate the suitcase. A world map poster on the wall has a circle around the destination. {heroName} has an excited, focused expression. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Cozy bedroom scene with travel preparation excitement"
      },
      {
        pageNumber: 2,
        text: "'I'm going on an airplane!' said {heroName} excitedly. The airport was big and busy!",
        imageDescription: `Illustrate {heroName} (maintaining exact appearance) in a busy airport terminal, holding a small backpack and looking up in awe at the high ceilings and large windows showing airplanes. People with luggage move around them. Departure boards show destinations. {heroName} points excitedly at a plane visible through the window. The scale emphasizes how big everything seems to a child. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Bustling airport scene from child's perspective"
      },
      {
        pageNumber: 3,
        text: "On the airplane, {heroName} looked out the window. The clouds looked like fluffy cotton balls!",
        imageDescription: `Depict {heroName} (exact likeness) seated by an airplane window, face pressed gently against the glass with wonder. Outside, fluffy white clouds float by at eye level, some shaped like animals or castles. The wing tip is visible. Inside, show the cozy airplane seat with a seatbelt, tray table with juice and crackers. Sunlight streams through the window onto {heroName}'s amazed face. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Intimate airplane scene emphasizing wonder of flight"
      },
      {
        pageNumber: 4,
        text: "The airplane landed in a magical place with palm trees and blue water everywhere!",
        imageDescription: `Show {heroName} (exact appearance) stepping off the airplane stairs onto a tropical tarmac, arms spread wide to feel the warm breeze. Behind them, the airplane sits on the runway. Ahead, a paradise unfolds: tall palm trees swaying, bright blue ocean visible in the distance, colorful tropical flowers, and a rainbow in the sky. Other happy travelers are around. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Vibrant tropical arrival scene"
      },
      {
        pageNumber: 5,
        text: "{heroName} played on the beach and built sandcastles. The water was warm and fun!",
        imageDescription: `Illustrate {heroName} (maintaining likeness) kneeling on golden sand, patting the top of an elaborate sandcastle with towers, shells for decoration, and a seaweed flag. Gentle waves lap nearby. They wear beach clothes and a sun hat. Buckets and shovels surround them. The ocean is crystal blue with small friendly waves. Seagulls fly overhead. Pure beach joy on their face. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Classic beach scene with sandcastle building"
      },
      {
        pageNumber: 6,
        text: "But then {heroName} couldn't find the way back to the hotel. Everything looked the same!",
        imageDescription: `Show {heroName} (exact likeness) standing on the beach looking worried and confused, turning in different directions. The beach stretches in both directions with similar-looking palm trees and beach umbrellas. The sun is getting lower. {heroName} holds their beach bucket tightly, lower lip trembling slightly but trying to be brave. Footprints in the sand show they've walked in circles. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Gentle concern without being frightening"
      },
      {
        pageNumber: 7,
        text: "A friendly dolphin popped up from the water! 'I can help you!' the dolphin said with a smile.",
        imageDescription: `Magical moment as {heroName} (exact appearance) stands at the water's edge and a smiling dolphin emerges from the waves, water droplets sparkling in the air. The dolphin has kind eyes and a playful expression. {heroName}'s worried face transforms to surprised delight. The dolphin is close enough to touch, creating an intimate, friendly encounter. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Whimsical meeting with emphasis on dolphin's friendliness"
      },
      {
        pageNumber: 8,
        text: "The dolphin gave {heroName} a ride through the water to find the hotel. What fun!",
        imageDescription: `Action scene of {heroName} (maintaining exact likeness) riding on the dolphin's back through crystal clear shallow water, holding on gently to the dorsal fin. They're laughing with joy, water splashing playfully around them. The dolphin swims parallel to the beach. In the background, the hotel becomes visible with its colorful umbrellas and palm trees. Other beachgoers wave. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Dynamic water scene with movement and joy"
      },
      {
        pageNumber: 9,
        text: "The dolphin brought {heroName} safely back to the beach near the hotel. 'Thank you!' said {heroName}.",
        imageDescription: `Touching farewell scene with {heroName} (exact likeness) standing knee-deep in water, gently patting the dolphin's head in thanks. The hotel is clearly visible behind them on the beach. The dolphin nuzzles {heroName}'s hand affectionately. Both have warm, friendly expressions. The sun creates a golden glow on the water. A parent waves from the beach. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Emotional goodbye with gratitude and friendship"
      },
      {
        pageNumber: 10,
        text: "{heroName} had the best travel day ever! New places and new friends made everything special.",
        imageDescription: `Sunset scene with {heroName} (exact appearance) sitting on a beach towel with family, watching a beautiful sunset. The dolphin can be seen jumping playfully in the distance. {heroName} holds a seashell to their ear and has a dreamy, content expression. Vacation memories float in thought bubbles above: the airplane, sandcastle, dolphin ride. Golden hour light makes everything magical. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Peaceful conclusion with sunset and memories"
      }
    ]
  },

  // Visiting Places theme
  {
    id: 'visiting-places',
    theme: 'Visiting Places',
    title: "{heroName}'s Wonderful Day Out",
    pages: [
      {
        pageNumber: 1,
        text: "{heroName} was going to visit the zoo today! So many animals to see and meet!",
        imageDescription: `Show {heroName} (exact likeness from source) standing excitedly at the zoo entrance holding a parent's hand. The entrance has a large colorful arch with "ZOO" in fun letters and animal decorations. Flags and banners with animal prints flutter above. {heroName} wears comfortable clothes and a small backpack, bouncing on their toes with anticipation. Other families are entering too. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Welcoming zoo entrance with anticipation"
      },
      {
        pageNumber: 2,
        text: "'Look at all the animals!' said {heroName}. There were elephants, lions, and monkeys everywhere!",
        imageDescription: `Create a panoramic view with {heroName} (maintaining exact appearance) in the center, arms outstretched, surrounded by different animal enclosures. On the left, elephants spray water; in the middle distance, lions rest on rocks; to the right, monkeys swing on ropes. {heroName}'s expression shows pure amazement. Zoo paths wind between habitats with other visitors visible. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Overview scene showing zoo's variety and scale"
      },
      {
        pageNumber: 3,
        text: "{heroName} visited the monkey house first. The monkeys were swinging and playing games!",
        imageDescription: `Depict {heroName} (exact likeness) pressing hands against the glass of the monkey enclosure, mirroring a baby monkey on the other side doing the same. Other monkeys swing on ropes, play with toys, and chase each other in the background. One monkey makes a funny face. The enclosure has trees, ropes, and platforms. {heroName} giggles at their antics. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Interactive moment with playful monkeys"
      },
      {
        pageNumber: 4,
        text: "Next, {heroName} saw the big elephants. They were spraying water and having fun!",
        imageDescription: `Show {heroName} (exact appearance) standing safely behind a fence watching elephants play in a pool. One elephant sprays water from its trunk creating a rainbow in the mist. Baby elephants play in the mud. {heroName} laughs and claps as some water droplets reach them. Zookeepers toss fruits to the elephants. The scene captures the elephants' playful nature. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Joyful elephant encounter with water play"
      },
      {
        pageNumber: 5,
        text: "At the petting zoo, {heroName} met gentle goats and soft bunnies. They were so friendly!",
        imageDescription: `Intimate scene of {heroName} (maintaining likeness) sitting on hay bales surrounded by friendly farm animals. A white goat gently eats from {heroName}'s outstretched hand holding pellets. A fluffy bunny sits in their lap. Baby chicks peck nearby. A miniature pony nuzzles their shoulder. {heroName} has a gentle, caring expression. Soft afternoon light filters through. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Gentle, tactile interaction with petting zoo animals"
      },
      {
        pageNumber: 6,
        text: "But then {heroName} got separated from family in the crowd. Where did everyone go?",
        imageDescription: `Show {heroName} (exact likeness) standing still in a busy zoo pathway, looking around with concern. Crowds of people move past, all taller from {heroName}'s perspective. The familiar family members are not visible. {heroName} holds onto their small backpack straps tightly. Zoo signs point in different directions. Despite worry, they remember to stay in one place. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Child's perspective of being temporarily lost, handled sensitively"
      },
      {
        pageNumber: 7,
        text: "A kind zookeeper saw {heroName} and said, 'Don't worry, I'll help you find your family.'",
        imageDescription: `Comforting scene with a friendly zookeeper in uniform (khaki shirt, name badge, zoo logo) kneeling down to {heroName}'s (exact appearance) eye level. The zookeeper has a warm, reassuring smile and gentle posture. {heroName} looks relieved. The zookeeper holds a walkie-talkie. Other zoo staff are visible nearby. The setting feels safe and helpful. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Reassuring helper scene with kind authority figure"
      },
      {
        pageNumber: 8,
        text: "The zookeeper used the loudspeaker to call {heroName}'s family. 'Come to the main gate!'",
        imageDescription: `Show {heroName} (maintaining exact likeness) standing with the zookeeper at an information booth near the main gate. The zookeeper speaks into a microphone while {heroName} watches hopefully. Above, speakers on poles broadcast the message. Other visitors look around helpfully. A zoo map on the booth shows "You Are Here" marker. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Problem-solving scene with zoo infrastructure"
      },
      {
        pageNumber: 9,
        text: "Family came running with big hugs! Everyone was so happy to be together again!",
        imageDescription: `Emotional reunion scene with {heroName} (exact likeness) running into family members' open arms. Multiple family members converge for a group hug. Expressions show relief and joy. The zookeeper stands nearby smiling. Other zoo visitors watch the happy reunion warmly. Motion lines show the running and embracing. Love and relief radiate from the scene. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Joyful reunion with emphasis on family love"
      },
      {
        pageNumber: 10,
        text: "{heroName} and family finished the zoo visit together. The best day out with the best family!",
        imageDescription: `Happy ending with {heroName} (exact appearance) on a family member's shoulders, pointing excitedly at giraffes in the distance. The whole family walks together on the zoo path during golden hour. Everyone carries a souvenir - {heroName} hugs a stuffed elephant. Other animals are visible in enclosures as they pass. Everyone has content smiles, closer together than before. ${COMMON_ART_STYLE}`,
        artStyleNotes: "Triumphant conclusion emphasizing togetherness"
      }
    ]
  }
];

// Helper function to get enhanced template
export function getEnhancedStoryTemplate(themeId: string): EnhancedStoryTemplate | null {
  return ENHANCED_STORY_TEMPLATES.find(template => template.id === themeId) || null;
}

// Function to prepare image prompt with hero details
export function prepareImagePrompt(
  imageDescription: string,
  heroName: string,
  heroAnalysis?: {
    age: string;
    hairColor: string;
    eyeColor: string;
    complexion: string;
    clothing: string;
    distinctiveFeatures: string;
  }
): string {
  let prompt = imageDescription.replace(/{heroName}/g, heroName);
  
  // If we have hero analysis, add more specific details
  if (heroAnalysis) {
    const heroDetails = `The character ${heroName} should appear as a ${heroAnalysis.age} with ${heroAnalysis.hairColor} hair, ${heroAnalysis.complexion} complexion, wearing ${heroAnalysis.clothing}. ${heroAnalysis.distinctiveFeatures ? `Notable features: ${heroAnalysis.distinctiveFeatures}.` : ''}`;
    
    // Insert hero details after the first mention of maintaining likeness
    prompt = prompt.replace(
      'exact likeness from source photo',
      `exact likeness from source photo - specifically: ${heroDetails}`
    );
  }
  
  return prompt;
}