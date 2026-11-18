import type { FullTestInput } from "@/lib/mock/schema";

const roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"];

export const passage2: FullTestInput["reading"][number] = {
  passage: 2,
  title: "Living Roofs",
  subtitle: "Can covering buildings with plants make cities better places to live?",
  paragraphs: [
    { label: "A", text: "Planting vegetation on top of buildings is often presented as a modern invention, but people have been doing it for thousands of years. In Scandinavia, houses were covered with layers of turf for centuries, because the soil provided excellent insulation against the long, cold winters. The modern green roof, however, began to take shape in Germany in the 1960s and 1970s, when engineers developed lightweight growing materials and waterproof membranes that roots could not penetrate. Today, around ten per cent of all flat roofs in Germany are green, and cities from Toronto to Singapore have introduced policies to encourage them." },
    { label: "B", text: "One of the main reasons for this interest is water. In a natural landscape, much of the rain that falls is absorbed by soil and plants. In a city, by contrast, it runs off roofs and roads into drains, which can quickly become overwhelmed during heavy storms. A green roof behaves more like a sponge. In a five-year study in Berlin, the hydrologist Dr Lena Hoffmann found that the roofs she monitored retained, on average, around sixty per cent of the rain that fell on them over a year, and released the rest slowly. 'Every litre held on a roof,' she points out, 'is a litre that doesn't arrive in the drains at the same moment as everyone else's.'" },
    { label: "C", text: "Green roofs also help to control temperature. A conventional black roof can reach seventy or even eighty degrees Celsius on a summer afternoon, heating the rooms beneath it and the air above. In Tokyo, Professor Kenji Watanabe measured surface temperatures on neighbouring buildings and found that planted roofs were up to thirty degrees cooler than conventional ones, partly because plants release water vapour as they grow. The buildings below needed less air conditioning. Watanabe is careful, however, not to overstate the effect at street level. 'A single green roof will not cool a neighbourhood,' he says. 'You only see a difference in the streets when a substantial share of the roofs in an area are green.'" },
    { label: "D", text: "For wildlife, green roofs can offer valuable islands of habitat in an environment dominated by concrete. Surveys in London and Basel have recorded dozens of species of bees, beetles and spiders on roofs that were planted with native wildflowers, including some species that are rare at ground level. Birds use the roofs to feed, and some ground-nesting species have even raised young there. Dr Maria Okonkwo, an ecologist who has studied urban insects, notes that the design of the roof matters a great deal: roofs planted with a single type of plant support far fewer species than those with varied plants, different soil depths and features such as logs and stones." },
    { label: "E", text: "Life on a roof is not easy for plants. Most green roofs, known as 'extensive' roofs, have a growing layer that is only five to fifteen centimetres deep, because deeper soil would be too heavy for most buildings to support. With so little soil, roots cannot reach far, and the plants are exposed to strong winds, intense sunshine and long dry periods. For this reason, designers usually choose drought-tolerant species such as sedum, a small plant that stores water in its thick leaves and can survive weeks without rain. Grasses and wildflowers that naturally grow on dry, rocky ground are also popular." },
    { label: "F", text: "Given these advantages, why are green roofs still relatively rare in most countries? Early concerns about weight and leaking have largely been solved by modern materials. The main obstacle today is cost. A green roof typically costs between two and three times as much to install as a conventional roof, and although it may last longer and reduce energy bills, many of its benefits — less flooding, cooler streets, more wildlife — are enjoyed by the city as a whole rather than by the owner who pays for it. The economist Professor Tom Ellis argues that this is a classic case for public policy. 'Without subsidies, regulations or reductions in water charges,' he says, 'most owners will never choose a green roof, however good the idea is for everyone else.' Cities that have introduced such measures, he notes, have seen the number of green roofs rise rapidly." },
  ],
  groups: [
    {
      id: "r2-headings",
      type: "matching",
      instructions: "Questions 14–19. Reading Passage 2 has six paragraphs, A–F. Choose the correct heading for each paragraph from the list of headings below. Write the correct number, i–ix.",
      title: "List of headings",
      options: [
        "The financial case for building owners",
        "How plants survive in difficult conditions",
        "An idea with a long history",
        "Reducing the risk of flooding",
        "Worries about weight and leaks",
        "A home for wildlife",
        "Why green roofs remain uncommon",
        "Cooler buildings, but limited effects on streets",
        "The future of rooftop farming",
      ].map((text, i) => ({ key: roman[i], text })),
      questions: [
        { n: 14, prompt: "Paragraph A", answer: ["iii"], explanation: "Turf roofs for centuries; modern roofs since the 1960s." },
        { n: 15, prompt: "Paragraph B", answer: ["iv"], explanation: "Roofs retain rain so drains are not overwhelmed." },
        { n: 16, prompt: "Paragraph C", answer: ["viii"], explanation: "Roofs up to 30°C cooler, but one roof won't cool a neighbourhood." },
        { n: 17, prompt: "Paragraph D", answer: ["vi"], explanation: "Bees, beetles, spiders and birds." },
        { n: 18, prompt: "Paragraph E", answer: ["ii"], explanation: "Shallow soil, wind, sun and drought; sedum stores water." },
        { n: 19, prompt: "Paragraph F", answer: ["vii"], explanation: "'why are green roofs still relatively rare…?' Weight and leaks are mentioned only as solved (heading v is a trap)." },
      ],
    },
    {
      id: "r2-people",
      type: "matching",
      instructions: "Questions 20–23. Look at the following statements and the list of researchers below. Match each statement with the correct researcher, A–D. NB You may use any letter more than once.",
      title: "List of researchers",
      allowReuse: true,
      options: [
        { key: "A", text: "Lena Hoffmann" },
        { key: "B", text: "Kenji Watanabe" },
        { key: "C", text: "Maria Okonkwo" },
        { key: "D", text: "Tom Ellis" },
      ],
      questions: [
        { n: 20, prompt: "The effect on outdoor temperatures depends on how many roofs in an area are green.", answer: ["B"], explanation: "'You only see a difference in the streets when a substantial share of the roofs… are green.'" },
        { n: 21, prompt: "Building owners need financial or legal encouragement to install green roofs.", answer: ["D"], explanation: "'Without subsidies, regulations or reductions in water charges…'" },
        { n: 22, prompt: "Green roofs can hold back most of the rain that falls on them.", answer: ["A"], explanation: "'retained… around sixty per cent of the rain'." },
        { n: 23, prompt: "Planted roofs can be far cooler than conventional ones.", answer: ["B"], explanation: "'up to thirty degrees cooler'." },
      ],
    },
    {
      id: "r2-summary",
      type: "completion-box",
      title: "Plants on extensive green roofs",
      instructions: "Questions 24–26. Complete the summary using the list of words, A–H, below.",
      options: [
        { key: "A", text: "shallow" },
        { key: "B", text: "drought-tolerant" },
        { key: "C", text: "tropical" },
        { key: "D", text: "winds" },
        { key: "E", text: "shade" },
        { key: "F", text: "deep" },
        { key: "G", text: "expensive" },
        { key: "H", text: "rain" },
      ],
      questions: [
        { n: 24, prompt: "Designers usually choose ___ plants such as sedum, which stores water in its leaves.", answer: ["B"], explanation: "'designers usually choose drought-tolerant species such as sedum'." },
        { n: 25, prompt: "The growing layer is very ___, so roots cannot reach far.", answer: ["A"], explanation: "'only five to fifteen centimetres deep… roots cannot reach far'." },
        { n: 26, prompt: "The plants must also cope with strong ___ and intense sunshine.", answer: ["D"], explanation: "'exposed to strong winds, intense sunshine and long dry periods'." },
      ],
    },
  ],
};
