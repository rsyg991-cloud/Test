import type { FullTestInput } from "@/lib/mock/schema";

export const passage1: FullTestInput["reading"][number] = {
  passage: 1,
  title: "The Frozen Water Trade",
  subtitle: "How ice from New England's lakes travelled around the world",
  paragraphs: [
    { text: "In the winter of 1806, a young Boston businessman named Frederic Tudor made a decision that his friends considered absurd. He would cut ice from the frozen ponds near his family's estate, load it onto a ship and sell it on the Caribbean island of Martinique, where the tropical heat made cold drinks an almost unimaginable luxury. Tudor was so certain of success that he bought a ship rather than renting one, since no captain he approached was willing to carry what sailors called a 'slippery and dangerous' cargo." },
    { text: "The voyage itself went better than many had predicted. Much of the ice survived the three-week journey, but Tudor had not considered what would happen when it arrived. There was nowhere on the island to store it, and the local population had no idea what to do with it. Within days, his cargo had melted away. The first venture lost him nearly four thousand dollars, a considerable sum at the time, and over the next decade further losses, combined with a family financial crisis, led to Tudor spending several short periods in a debtors' prison." },
    { text: "Tudor, however, was persistent, and he learned from each failure. His most important discovery was that ice lasts far longer when it is properly insulated. After experimenting with different materials, he found that sawdust, which at the time was a waste product of the many timber mills in Maine, was cheap, light and highly effective at slowing the melting process. Packed tightly in sawdust, blocks of ice could survive journeys of several months. Tudor also built his own icehouses in the ports he served, so that his product could be stored on arrival and sold gradually rather than all at once." },
    { text: "Just as important was the work of Nathaniel Wyeth, one of Tudor's suppliers, who in the 1820s invented a horse-drawn ice cutter. Before Wyeth's invention, workers had to cut ice by hand with saws and axes, producing irregular pieces that were difficult to pack. Wyeth's cutter, which scored deep parallel grooves in the frozen surface, allowed workers to produce large rectangular blocks of identical size. These could be stacked closely together, which reduced the surface area exposed to warm air and therefore reduced melting. The cost of harvesting fell dramatically." },
    { text: "The process of harvesting became highly organised. Work began only when the ice was at least thirty centimetres thick; thinner ice was dangerous for both men and horses. Teams first cleared the snow from the surface, since snow acted as a blanket and slowed further freezing. The ice was then marked out, cut into blocks and floated along open channels to the edge of the lake, where it was lifted by conveyor into enormous wooden icehouses. These buildings had double walls, and the gap between them was filled with hay to keep out the summer heat." },
    { text: "By the 1840s, ice from New England was being shipped not only to the southern United States and the Caribbean, but as far away as Brazil, China and India. The first shipment to Calcutta, in 1833, caused a sensation: after a voyage of four months, more than half of the original cargo was still frozen. British residents and wealthy Indian families used the ice above all to cool drinks, but it was also valued by doctors, who used it to reduce the temperature of patients suffering from fever." },
    { text: "At home, too, demand grew rapidly. As cities expanded, households began to buy ice to keep food fresh in insulated wooden cabinets known as iceboxes. Brewers needed ice to produce new styles of beer that had to be fermented at low temperatures, and the fishing industry used vast quantities to keep catches fresh during the journey to market. By the 1880s, the American ice industry employed tens of thousands of people, and the annual harvest exceeded eight million tonnes." },
    { text: "Yet the industry's decline was already under way. Mechanical refrigeration had been developed in the middle of the century, and machines that could manufacture ice were in use in the southern states, where natural ice was always expensive, by the 1870s. At first, artificial ice was more costly than ice cut from lakes, and many customers believed it was less pure. The change was therefore gradual rather than sudden. Over the following decades, however, the machines became cheaper and more reliable." },
    { text: "Natural ice also faced a problem of its own making. As towns and factories grew along the rivers and lakes of New England, the water became increasingly polluted, and doctors began to warn that ice harvested from such sources could spread disease. Warm winters, which left the ice too thin to harvest, caused occasional shortages that damaged the trade's reputation for reliability. By the 1930s, when electric refrigerators had become common in American homes, the natural ice trade had all but disappeared." },
    { text: "Today, Tudor's story is often told as an example of how persistence can turn an unlikely idea into a global business. Historians also point out that the frozen water trade changed eating habits and created an expectation of cold food and drink that the modern refrigeration industry was later able to satisfy." },
  ],
  groups: [
    {
      id: "r1-tfng",
      type: "tfng",
      instructions: "Questions 1–7. Do the following statements agree with the information given in Reading Passage 1? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
      questions: [
        { n: 1, prompt: "Tudor's first shipment of ice made a profit.", answer: ["FALSE"], explanation: "'The first venture lost him nearly four thousand dollars.'" },
        { n: 2, prompt: "Tudor had worked as a sailor before starting his ice business.", answer: ["NOT GIVEN"], explanation: "Sailors are mentioned only as refusing to carry the cargo; nothing is said about Tudor's previous work." },
        { n: 3, prompt: "Sawdust was used to slow the melting of ice during transport.", answer: ["TRUE"], explanation: "'Packed tightly in sawdust, blocks of ice could survive journeys of several months.'" },
        { n: 4, prompt: "Wyeth's invention made it possible to produce blocks of the same size.", answer: ["TRUE"], explanation: "'large rectangular blocks of identical size'." },
        { n: 5, prompt: "Ice from New England was sold in India.", answer: ["TRUE"], explanation: "'as far away as Brazil, China and India… The first shipment to Calcutta'." },
        { n: 6, prompt: "The natural ice trade ended suddenly when ice-making machines were invented.", answer: ["FALSE"], explanation: "'The change was therefore gradual rather than sudden.'" },
        { n: 7, prompt: "Water pollution contributed to the decline of the natural ice industry.", answer: ["TRUE"], explanation: "Doctors warned that ice from polluted sources could spread disease." },
      ],
    },
    {
      id: "r1-notes",
      type: "completion",
      title: "Harvesting and using natural ice",
      instructions: "Questions 8–13. Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.",
      wordLimit: { words: 1, number: false },
      questions: [
        { n: 8, section: "Harvesting", prompt: "Ice had to be at least 30 cm ___ before work began", answer: ["thick"], explanation: "'at least thirty centimetres thick'." },
        { n: 9, prompt: "Workers first removed ___ from the surface", answer: ["snow"], explanation: "'Teams first cleared the snow from the surface'." },
        { n: 10, prompt: "Walls of icehouses were insulated with ___", answer: ["hay"], explanation: "'the gap between them was filled with hay'." },
        { n: 11, section: "Uses", prompt: "In India: mainly used to cool ___", answer: ["drinks"], explanation: "'used the ice above all to cool drinks'." },
        { n: 12, prompt: "Doctors used ice to treat patients with a ___", answer: ["fever"], explanation: "'patients suffering from fever'." },
        { n: 13, prompt: "In the USA: needed by the ___ industry to keep catches fresh", answer: ["fishing"], explanation: "'the fishing industry used vast quantities'." },
      ],
    },
  ],
};
