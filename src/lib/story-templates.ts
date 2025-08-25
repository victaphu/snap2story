export interface StoryTemplate {
  id: string;
  theme: string;
  title: string;
  pages: {
    pageNumber: number;
    text: string;
    imageDescription: string;
  }[];
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'bedtime',
    theme: 'Bedtime',
    title: "{heroName}'s Sleepy Adventure",
    pages: [
      {
        pageNumber: 1,
        text: "{heroName} was getting ready for bed. The moon was bright and the stars were twinkling.",
        imageDescription: "Create a warm, cozy children's book illustration showing {heroName} (matching the exact appearance from the source photo - same age, hair color, facial features, and complexion) wearing cute pajamas, standing by a bedroom window. The character should maintain their exact likeness but rendered in a soft, whimsical storybook art style. Show a peaceful nighttime scene outside with a large, friendly moon face and sparkling stars. The bedroom should have soft pastel colors, a small bed with stuffed animals, and warm lighting from a bedside lamp. Art style: Gentle watercolor or digital painting with soft edges, warm colors, and a dreamy atmosphere suitable for bedtime stories for toddlers."
      },
      {
        pageNumber: 2,
        text: "But {heroName} wasn't sleepy yet! 'I want to play more!' said {heroName}.",
        imageDescription: "Illustrate {heroName} (maintaining exact likeness from source photo) energetically jumping on a cozy bed in pajamas, with a big playful smile. The character's appearance should match the source exactly but in a cheerful children's book style. Scatter colorful toys around - teddy bears, blocks, toy cars, and dolls. The room has soft night lighting with a lamp casting warm shadows. Show motion lines to indicate jumping. Art style: Vibrant but soft digital illustration with rounded, child-friendly shapes, warm bedroom colors (soft yellows, pinks, blues), capturing the playful energy of a child not ready for sleep."
      },
      {
        pageNumber: 3,
        text: "Suddenly, a magical sleepy fairy appeared! 'Would you like to see the dream world?' she asked.",
        imageDescription: "Create a magical moment showing {heroName} (exact likeness from source) sitting up in bed, eyes wide with wonder, as a beautiful glowing fairy appears. The fairy should be small (hand-sized), with translucent wings, flowing hair, and a dress made of stardust, emanating soft blue and purple light. Golden sparkles and dream dust float in the air. {heroName}'s expression shows amazement and curiosity. The bedroom fades slightly into soft focus around the edges. Art style: Ethereal children's book illustration with glowing effects, soft pastels mixed with magical sparkles, creating a dreamlike atmosphere."
      },
      {
        pageNumber: 4,
        text: "{heroName} followed the fairy through a cloud door. Everything was soft and fluffy!",
        imageDescription: "Illustrate {heroName} (maintaining exact appearance from source) holding the fairy's tiny hand while stepping through a magical doorway made entirely of fluffy white and pink clouds. The doorway glows with soft rainbow edges. Beyond the door, show a glimpse of a dreamy cloudscape with pastel skies. {heroName} looks excited but slightly cautious, one foot through the door. Their pajamas flutter gently. Art style: Whimsical children's illustration with cotton candy-like cloud textures, soft gradients, and a sense of magical transition between the real world and dream world."
      },
      {
        pageNumber: 5,
        text: "In dream land, {heroName} met friendly animals having a tea party. 'Join us!' they said.",
        imageDescription: "Show {heroName} (exact likeness from source) sitting cross-legged at a low, round table made of a giant mushroom, surrounded by adorable animated animals: a fluffy white rabbit in a bow tie, a cuddly brown bear in a vest, a striped cat with a tiny hat, and a wise owl with spectacles. They're having a tea party with miniature floral teacups and a plate of star-shaped cookies. The setting is a dreamy garden with oversized flowers, floating bubbles, and soft clouds as the ground. Art style: Charming storybook illustration with cute, rounded character designs, soft textures, and pastel dream colors creating a welcoming, magical tea party scene."
      },
      {
        pageNumber: 6,
        text: "But then {heroName} got lost! The dream world was big and {heroName} couldn't find the way home.",
        imageDescription: "Depict {heroName} (exact likeness from source) standing alone in a vast, misty dreamscape, looking worried with slightly teary eyes. The character should maintain their exact appearance but show gentle concern. The dream world has multiple winding, colorful paths made of rainbow ribbons floating in different directions through purple-blue mist. Strange but friendly dream elements float by - upside-down trees, floating doors, gentle cloud creatures watching from afar. Despite being lost, the scene isn't scary but rather mysterious and soft. Art style: Atmospheric children's illustration with soft, misty effects, muted dream colors, conveying gentle concern without fear."
      },
      {
        pageNumber: 7,
        text: "The sleepy fairy found {heroName}. 'Don't worry, I'll help you get home safely,' she said kindly.",
        imageDescription: "Illustrate a heartwarming scene of the glowing fairy embracing {heroName} (maintaining exact likeness from source) in a comforting hug. The fairy glows brighter with warm golden light that wraps around both characters like a protective bubble. {heroName}'s worried expression transforms to relief and trust. Soft star particles float around them, and the misty background begins to clear showing a path made of moonbeams. Art style: Tender, emotional children's book illustration with warm glowing effects, soft brushwork, emphasizing comfort and safety through light and gentle expressions."
      },
      {
        pageNumber: 8,
        text: "{heroName} rode on a fluffy cloud back to the bedroom. What a wonderful adventure!",
        imageDescription: "Show {heroName} (exact appearance from source) sitting happily on a large, fluffy white cloud that serves as a magical vehicle, with the fairy flying alongside. The cloud has a slight smile and moves gently through a beautiful night sky filled with stars that look like glitter. Below, show the rooftops of houses getting closer, with {heroName}'s house glowing warmly. {heroName} waves at sleeping moon and star friends as they pass. Art style: Joyful children's book scene with dynamic movement, sparkly night sky, soft cloud textures, creating a sense of magical flight and happy return journey."
      },
      {
        pageNumber: 9,
        text: "Back in bed, {heroName} felt so sleepy and happy. The fairy tucked {heroName} in with love.",
        imageDescription: "Create a tender bedtime scene with {heroName} (maintaining exact likeness) lying in their cozy bed, eyes becoming drowsy with a content smile. The fairy gently pulls up a soft quilt decorated with stars and moons, her wings creating a gentle breeze. The room is bathed in soft moonlight from the window, and the adventure toys from earlier are now neatly arranged. A gentle glow surrounds both characters showing the warmth of the moment. Art style: Soft, nurturing children's illustration with warm lighting, cozy textures, and peaceful expressions conveying safety and love."
      },
      {
        pageNumber: 10,
        text: "{heroName} fell asleep with the biggest smile. Sweet dreams filled the night!",
        imageDescription: "Illustrate {heroName} (exact likeness from source) peacefully sleeping with a gentle, happy smile, tucked under the star-patterned quilt. Above their head, show translucent dream bubbles containing happy memories from the adventure - the tea party, cloud ride, and fairy friend. The fairy sits on the windowsill keeping gentle watch, now tiny and glowing softly. Moonlight streams through the window creating silver patterns on the floor. The whole room emanates peace and magical protection. Art style: Serene children's book ending with dreamy effects, soft blue-purple night colors, gentle lighting, creating the perfect peaceful conclusion to a bedtime story."
      }
    ]
  },
  {
    id: 'family-adventures',
    theme: 'Family Adventures',
    title: "{heroName} and the Great Family Quest",
    pages: [
      {
        pageNumber: 1,
        text: "{heroName} was having a picnic with family in the park. The sun was shining bright!",
        imageDescription: "Create a cheerful outdoor scene showing {heroName} (exact likeness from source photo) sitting on a checkered red and white picnic blanket with family members in a sunny park. The character must maintain their exact appearance but in a bright, storybook style. Show a wicker picnic basket, colorful sandwiches, fresh fruits, juice boxes, and cookies spread on the blanket. The park has green grass, a few shade trees with dappled sunlight, and flowers dotting the landscape. Blue sky with fluffy white clouds. Art style: Vibrant children's book illustration with warm, sunny colors, clear outlines, and a joyful atmosphere perfect for a family outing."
      },
      {
        pageNumber: 2,
        text: "'Let's go on an adventure!' said {heroName}. Everyone was excited to explore together.",
        imageDescription: "Illustrate {heroName} (maintaining exact likeness from source) standing up enthusiastically, arms raised, with a big adventurous smile, pointing toward a wooded area. Family members are getting up from the picnic blanket, putting on small backpacks and sun hats, all with excited expressions. {heroName} should be the central focus, showing leadership and enthusiasm. The background shows the edge of an inviting forest with a visible path. Art style: Dynamic children's book illustration with action poses, bright colors, and expressions showing excitement and anticipation for adventure."
      },
      {
        pageNumber: 3,
        text: "They found a magical path in the woods. Colorful butterflies danced all around them!",
        imageDescription: "Depict {heroName} (exact appearance from source) leading the family along a enchanted forest path dappled with golden sunlight filtering through leaves. Dozens of magical butterflies in rainbow colors - blue morphos, orange monarchs, pink and purple fantasy butterflies - flutter and dance around the family. The path is covered with soft moss and bordered by ferns and wildflowers. Trees arch overhead creating a natural tunnel. {heroName} reaches out gently toward a butterfly. Art style: Magical realism children's illustration with vibrant butterfly colors, soft forest light, creating wonder and natural beauty."
      },
      {
        pageNumber: 4,
        text: "The family discovered a hidden playground made of flowers and vines. So amazing!",
        imageDescription: "Show a fantastical natural playground where {heroName} (maintaining exact likeness) stands in awe. Feature: swings made from strong flowering vines with seats of giant lily pads, a slide formed from smooth, giant flower petals in pink and yellow, climbing structures made of intertwined tree roots and branches decorated with blooming flowers, and a merry-go-round of spinning sunflowers. Everything is safely magical and naturally integrated into the forest clearing. Soft grass cushions the ground. Art style: Whimsical fantasy children's book art with impossible but beautiful natural structures, bright floral colors, and a sense of magical discovery."
      },
      {
        pageNumber: 5,
        text: "{heroName} and family played together. They laughed and had so much fun!",
        imageDescription: "Illustrate a joyful action scene with {heroName} (exact likeness from source) going down the flower petal slide with arms up in joy, while family members swing on the vine swings and climb the root structures. Everyone has huge smiles and some are mid-laugh. Capture the movement with flowing hair and clothes. Butterflies from earlier still flutter around adding to the magical atmosphere. Show genuine family bonding and pure childhood joy. Art style: Energetic children's book illustration with movement lines, happy expressions, bright colors, capturing a perfect moment of family fun."
      },
      {
        pageNumber: 6,
        text: "Oh no! Dark clouds came and it started to rain. Everyone got wet and cold.",
        imageDescription: "Show {heroName} (exact likeness from source) and family caught in sudden rain, huddling close together. Dark purple-gray clouds fill the sky, with illustrated rain lines falling. The magical playground is getting wet. Family members hold hands, with {heroName} in the middle looking concerned but brave. Their clothes and hair are getting wet. One family member tries to use a picnic blanket as makeshift shelter. Despite the situation, they stay together. Art style: Dramatic children's book illustration with darker colors but not scary, showing rain effects and family unity in adversity, maintaining child-appropriate concern levels."
      },
      {
        pageNumber: 7,
        text: "But then they found a cozy cave. Inside, friendly forest animals welcomed them warmly.",
        imageDescription: "Illustrate {heroName} (maintaining exact appearance) and family entering a warm, inviting cave lit by soft bioluminescent mushrooms. Inside, friendly woodland creatures await: a motherly bear with cubs, wise badgers, playful squirrels, and gentle deer. The animals offer soft moss cushions and leaf blankets. The cave is cozy with smooth walls, natural shelves holding acorns and berries, and a feeling of safety. {heroName} looks relieved and curious. Art style: Warm, cozy children's book scene with golden cave lighting, friendly animal faces, transitioning from the cold rain outside to warm comfort inside."
      },
      {
        pageNumber: 8,
        text: "The animals shared their food and told funny stories. The family felt so happy and warm.",
        imageDescription: "Create a heartwarming scene with {heroName} (exact likeness) sitting cross-legged in a circle with family and forest animals. The bear shares honey from a wooden bowl, squirrels offer acorns and berries, while a rabbit demonstrates something funny making everyone laugh. {heroName} is mid-giggle, holding their tummy. Warm golden light from glowing mushrooms illuminates happy faces. Show genuine connection between humans and animals. Art style: Cozy children's book illustration with warm colors, expressive faces showing laughter and joy, emphasizing friendship and sharing."
      },
      {
        pageNumber: 9,
        text: "When the rain stopped, a beautiful rainbow appeared! The animals showed them the way home.",
        imageDescription: "Depict {heroName} (exact appearance from source) and family emerging from the cave to see a magnificent rainbow arching across the now-clear sky. Sunlight breaks through clouds creating magical lighting. The forest animals stand at the cave entrance, with the wise badger pointing toward a clear path home. Water droplets on leaves sparkle like diamonds. {heroName} waves goodbye to new animal friends while pointing excitedly at the rainbow. Art style: Stunning children's book illustration with vibrant rainbow colors, sparkling post-rain effects, combining farewell emotion with natural beauty."
      },
      {
        pageNumber: 10,
        text: "{heroName} and family went home with hearts full of love. What a perfect adventure together!",
        imageDescription: "Show {heroName} (maintaining exact likeness) walking hand-in-hand with family members along a sunny path toward home, with the rainbow still visible in the background. Everyone has content, happy expressions. {heroName} skips slightly while walking, still energetic from the adventure. In the distance, some animal friends can be seen waving goodbye from the forest edge. Their clothes are drying in the sun, and each person carries a small memento - a pretty stone, a flower, a feather. Art style: Heartwarming children's book conclusion with golden hour lighting, emphasizing family bonds and the perfect end to an adventure."
      }
    ]
  },
  {
    id: 'celebrations',
    theme: 'Celebrations',
    title: "{heroName}'s Special Celebration Day",
    pages: [
      {
        pageNumber: 1,
        text: "Today was {heroName}'s special day! Balloons and decorations were everywhere.",
        imageDescription: "{heroName} in a room decorated with colorful balloons, streamers, and party decorations"
      },
      {
        pageNumber: 2,
        text: "{heroName} was so excited! 'I can't wait for everyone to come to my party!' said {heroName}.",
        imageDescription: "{heroName} jumping with joy, arms raised high with a big smile"
      },
      {
        pageNumber: 3,
        text: "Friends and family started arriving with presents and big smiles. The party was beginning!",
        imageDescription: "Friends and family members arriving at the door with wrapped gifts and happy faces"
      },
      {
        pageNumber: 4,
        text: "Everyone played fun games together. They danced, sang songs, and laughed so much!",
        imageDescription: "{heroName} and friends playing party games, dancing and singing together"
      },
      {
        pageNumber: 5,
        text: "Then came the most special moment - time for the birthday cake with candles!",
        imageDescription: "A beautiful birthday cake with candles, everyone gathered around singing"
      },
      {
        pageNumber: 6,
        text: "Oh no! A strong wind blew out all the candles before {heroName} could make a wish!",
        imageDescription: "Wind blowing out the candles on the cake, everyone looking surprised"
      },
      {
        pageNumber: 7,
        text: "Everyone felt sad for a moment. But then Grandma had a wonderful idea!",
        imageDescription: "Grandma with a kind smile, pointing up with her finger like she has an idea"
      },
      {
        pageNumber: 8,
        text: "'Let's all make a wish together!' said Grandma. Everyone closed their eyes and wished.",
        imageDescription: "Everyone holding hands in a circle around the cake with eyes closed, making wishes"
      },
      {
        pageNumber: 9,
        text: "Suddenly, magical sparkles appeared! Everyone's wishes were floating in the air like stars!",
        imageDescription: "Beautiful golden sparkles and wish-stars floating above everyone's heads"
      },
      {
        pageNumber: 10,
        text: "{heroName} felt so loved and happy. The best celebration ever with the best people ever!",
        imageDescription: "{heroName} surrounded by loving family and friends, everyone hugging and smiling"
      }
    ]
  },
  {
    id: 'travel',
    theme: 'Travel',
    title: "{heroName}'s Amazing Journey",
    pages: [
      {
        pageNumber: 1,
        text: "{heroName} was packing for a big trip! Clothes, toys, and snacks went into the suitcase.",
        imageDescription: "{heroName} sitting next to an open suitcase, putting clothes and toys inside"
      },
      {
        pageNumber: 2,
        text: "'I'm going on an airplane!' said {heroName} excitedly. The airport was big and busy!",
        imageDescription: "{heroName} at the airport looking amazed at the big airplanes through the window"
      },
      {
        pageNumber: 3,
        text: "On the airplane, {heroName} looked out the window. The clouds looked like fluffy cotton balls!",
        imageDescription: "{heroName} sitting by an airplane window, looking at puffy white clouds below"
      },
      {
        pageNumber: 4,
        text: "The airplane landed in a magical place with palm trees and blue water everywhere!",
        imageDescription: "A tropical paradise with palm trees, blue ocean, and {heroName} stepping off the plane"
      },
      {
        pageNumber: 5,
        text: "{heroName} played on the beach and built sandcastles. The water was warm and fun!",
        imageDescription: "{heroName} building sandcastles on a sunny beach with gentle waves nearby"
      },
      {
        pageNumber: 6,
        text: "But then {heroName} couldn't find the way back to the hotel. Everything looked the same!",
        imageDescription: "{heroName} looking confused and worried, standing alone on the beach"
      },
      {
        pageNumber: 7,
        text: "A friendly dolphin popped up from the water! 'I can help you!' the dolphin said with a smile.",
        imageDescription: "A cute, friendly dolphin in the water talking to {heroName} on the beach"
      },
      {
        pageNumber: 8,
        text: "The dolphin gave {heroName} a ride through the water to find the hotel. What fun!",
        imageDescription: "{heroName} riding on the dolphin's back through clear blue water, both smiling"
      },
      {
        pageNumber: 9,
        text: "The dolphin brought {heroName} safely back to the beach near the hotel. 'Thank you!' said {heroName}.",
        imageDescription: "{heroName} waving goodbye to the dolphin from the beach, hotel visible in background"
      },
      {
        pageNumber: 10,
        text: "{heroName} had the best travel day ever! New places and new friends made everything special.",
        imageDescription: "{heroName} sitting on the beach at sunset, looking happy with the dolphin in the distance"
      }
    ]
  },
  {
    id: 'visiting-places',
    theme: 'Visiting Places',
    title: "{heroName}'s Wonderful Day Out",
    pages: [
      {
        pageNumber: 1,
        text: "{heroName} was going to visit the zoo today! So many animals to see and meet!",
        imageDescription: "{heroName} standing at the zoo entrance with a big zoo sign and colorful flags"
      },
      {
        pageNumber: 2,
        text: "'Look at all the animals!' said {heroName}. There were elephants, lions, and monkeys everywhere!",
        imageDescription: "{heroName} pointing excitedly at various zoo animals in their enclosures"
      },
      {
        pageNumber: 3,
        text: "{heroName} visited the monkey house first. The monkeys were swinging and playing games!",
        imageDescription: "{heroName} watching playful monkeys swinging on ropes and playing together"
      },
      {
        pageNumber: 4,
        text: "Next, {heroName} saw the big elephants. They were spraying water and having fun!",
        imageDescription: "{heroName} watching elephants playing in water, spraying themselves with their trunks"
      },
      {
        pageNumber: 5,
        text: "At the petting zoo, {heroName} met gentle goats and soft bunnies. They were so friendly!",
        imageDescription: "{heroName} sitting with cute goats and rabbits, gently petting them"
      },
      {
        pageNumber: 6,
        text: "But then {heroName} got separated from family in the crowd. Where did everyone go?",
        imageDescription: "{heroName} looking worried and alone in a crowd of people at the zoo"
      },
      {
        pageNumber: 7,
        text: "A kind zookeeper saw {heroName} and said, 'Don't worry, I'll help you find your family.'",
        imageDescription: "A friendly zookeeper in uniform kneeling down to talk to {heroName} kindly"
      },
      {
        pageNumber: 8,
        text: "The zookeeper used the loudspeaker to call {heroName}'s family. 'Come to the main gate!'",
        imageDescription: "The zookeeper at a booth with {heroName}, speaking into a microphone"
      },
      {
        pageNumber: 9,
        text: "Family came running with big hugs! Everyone was so happy to be together again!",
        imageDescription: "{heroName} running into the arms of family members for a big group hug"
      },
      {
        pageNumber: 10,
        text: "{heroName} and family finished the zoo visit together. The best day out with the best family!",
        imageDescription: "{heroName} and family walking together past zoo animals, everyone smiling and happy"
      }
    ]
  }
  ,
  {
    id: 'adventure',
    theme: 'Adventure & Exploration',
    title: "{heroName}'s Big Adventure",
    pages: Array.from({ length: 10 }, (_, i) => ({
      pageNumber: i + 1,
      text: `Adventure page ${i + 1}: {heroName} explores, discovers, and learns with a brave smile.`,
      imageDescription: `{heroName} exploring outdoors with curious eyes; bright whimsical storybook style, soft watercolour textures, rounded shapes, expressive faces, warm and inviting lighting.`,
    })),
  },
  {
    id: 'friendship',
    theme: 'Friendship & Kindness',
    title: "{heroName}'s Kind Heart",
    pages: Array.from({ length: 10 }, (_, i) => ({
      pageNumber: i + 1,
      text: `Friendship page ${i + 1}: {heroName} shares, helps friends, and spreads kindness.`,
      imageDescription: `{heroName} playing and helping a friend; bright whimsical storybook style, soft watercolour textures, rounded shapes, expressive faces, warm and inviting lighting.`,
    })),
  },
  {
    id: 'family',
    theme: 'Family & Home Life',
    title: "{heroName}'s Cozy Day",
    pages: Array.from({ length: 10 }, (_, i) => ({
      pageNumber: i + 1,
      text: `Family page ${i + 1}: {heroName} enjoys a loving day with family.`,
      imageDescription: `{heroName} at home with family warmth; bright whimsical storybook style, soft watercolour textures, rounded shapes, expressive faces, warm and inviting lighting.`,
    })),
  },
  {
    id: 'dreams',
    theme: 'Dreams & Imagination',
    title: "{heroName}'s Dream Journey",
    pages: Array.from({ length: 10 }, (_, i) => ({
      pageNumber: i + 1,
      text: `Dream page ${i + 1}: {heroName} visits whimsical worlds with gentle wonder.`,
      imageDescription: `{heroName} in a dreamy, magical scene; bright whimsical storybook style, soft watercolour textures, rounded shapes, expressive faces, warm and inviting lighting.`,
    })),
  }
];

export function getStoryTemplate(themeId: string): StoryTemplate | null {
  // 1) Exact id match
  const exact = STORY_TEMPLATES.find(t => t.id === themeId);
  if (exact) return exact;
  // 2) Fuzzy match by theme name
  const fuzzy = STORY_TEMPLATES.find(t => t.theme.toLowerCase().includes((themeId || '').toLowerCase()));
  if (fuzzy) return fuzzy;
  // 3) Fallback: build a minimal template so preview can proceed
  const SLUG_TO_NAME: Record<string, string> = {
    adventure: 'Adventure & Exploration',
    friendship: 'Friendship & Kindness',
    family: 'Family & Home Life',
    dreams: 'Dreams & Imagination',
  };
  const name = SLUG_TO_NAME[themeId] || themeId;
  return {
    id: themeId,
    theme: name,
    title: "{heroName}'s Adventure",
    pages: [],
  };
}

export function generateBookTitle(themeId: string, heroName: string): string {
  const template = getStoryTemplate(themeId);
  if (!template) return `${heroName}'s Adventure`;
  
  return template.title.replace(/{heroName}/g, heroName);
}
