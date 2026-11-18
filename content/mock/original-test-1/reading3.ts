import type { FullTestInput } from "@/lib/mock/schema";

const abc = (...t: string[]) => t.map((text, i) => ({ key: "ABCDEFG"[i], text }));

export const passage3: FullTestInput["reading"][number] = {
  passage: 3,
  title: "In Praise of Boredom",
  subtitle: "Is boredom a problem to be solved, or a signal worth listening to?",
  paragraphs: [
    { text: "Few experiences are as universally disliked as boredom. We describe it as something that 'kills' time, we apologise to guests if an event turns out to be dull, and we go to considerable lengths to avoid it. The arrival of the smartphone, with its endless supply of messages, videos and games, appears to have offered a final solution: in a queue, on a train or in a waiting room, relief is never more than a few seconds away. It would be a mistake, however, to conclude that we are now less bored than previous generations. If anything, the evidence suggests that our tolerance for even brief moments of inactivity has fallen, so that we reach for distraction sooner and feel bored more easily when it is unavailable." },
    { text: "Until relatively recently, psychologists paid little attention to boredom, regarding it as a trivial state that simply indicated a lack of stimulation. That view has changed. Researchers now tend to describe boredom as a signal, comparable to hunger or pain, which tells us that what we are currently doing does not satisfy our need for meaningful engagement. Like other unpleasant signals, it is useful precisely because it is uncomfortable: it pushes us to change our situation. The question is what we do in response to it." },
    { text: "Some of the most striking research concerns the link between boredom and creativity. In one well-known experiment, the British psychologists Sandi Mann and Rebekah Cadman asked one group of participants to spend fifteen minutes copying numbers from a telephone directory — a task chosen for its extreme dullness — while a second group went straight to the next stage. Both groups were then asked to think of as many uses as possible for a pair of plastic cups. Those who had endured the boring task produced significantly more ideas, and their ideas were judged to be more original. Mann's explanation is that boredom encourages the mind to wander, searching for the stimulation that the environment fails to provide." },
    { text: "Neuroscience offers a possible mechanism. When we are not focused on an external task, a set of brain regions known as the 'default mode network' becomes more active. This network appears to be involved in daydreaming, remembering the past, imagining the future and making connections between apparently unrelated ideas. People often report that a solution to a problem came to them while they were doing something simple, such as walking or washing up; these are exactly the moments when attention is free to wander. Remove such moments from our lives, and we may also remove some of the conditions in which new ideas tend to appear." },
    { text: "Yet many people find it surprisingly difficult to be alone with their own thoughts. In a series of studies in the United States, participants were asked to sit alone in a room for up to fifteen minutes with nothing to do but think. Many described the experience as unpleasant. In one version, participants were given the option of giving themselves a mild electric shock during the period of reflection, a shock that most had earlier said they would pay money to avoid. A remarkable number chose to press the button at least once, apparently preferring an unpleasant sensation to no sensation at all." },
    { text: "This is where constant digital stimulation becomes a concern. If every gap in the day is immediately filled, boredom never has the chance to do its job. The signal is switched off before we have considered what it might be telling us, and before the mind has been given time to wander. I am not suggesting that we should give up our phones; that would be neither practical nor desirable. But it may be worth occasionally resisting the reflex to reach for them, and allowing a few minutes of unstimulated time to pass." },
    { text: "None of this means that all boredom is beneficial. There is an important difference between the occasional boredom of a slow afternoon and chronic boredom — a persistent feeling that life is empty or meaningless. The latter has been associated with depression, anxiety, overeating and risky behaviour, and should be taken seriously rather than celebrated. Some philosophers have been even more pessimistic: the nineteenth-century Danish thinker Søren Kierkegaard described boredom as 'the root of all evil', a force that drove people to harmful excitement." },
    { text: "The lesson, then, is not that we should seek out boredom for its own sake, but that we should treat it as information. Children, in particular, may benefit from some unstructured time that is not filled by adults with organised activities, since learning to deal with boredom is part of learning to direct one's own attention. For adults, too, a little boredom may be a price worth paying for a mind that has room to think." },
  ],
  groups: [
    {
      id: "r3-ynng",
      type: "ynng",
      instructions: "Questions 27–31. Do the following statements agree with the claims of the writer in Reading Passage 3? Write YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
      questions: [
        { n: 27, prompt: "People today experience less boredom than people in the past.", answer: ["NO"], explanation: "'It would be a mistake… to conclude that we are now less bored than previous generations.'" },
        { n: 28, prompt: "Boredom can encourage creative thinking.", answer: ["YES"], explanation: "The writer presents the Mann and Cadman research and the 'default mode network' in support." },
        { n: 29, prompt: "Children are more easily bored than adults.", answer: ["NOT GIVEN"], explanation: "Children are mentioned, but the writer makes no comparison with adults." },
        { n: 30, prompt: "People should stop using smartphones altogether.", answer: ["NO"], explanation: "'I am not suggesting that we should give up our phones'." },
        { n: 31, prompt: "Children may benefit from time that is not organised by adults.", answer: ["YES"], explanation: "'Children… may benefit from some unstructured time'." },
      ],
    },
    {
      id: "r3-mcq",
      type: "mcq",
      instructions: "Questions 32–35. Choose the correct letter, A, B, C or D.",
      questions: [
        {
          n: 32,
          prompt: "In Mann and Cadman's experiment, participants who did the boring task",
          options: abc("A gave up the second task more quickly.", "B produced more and better ideas.", "C copied the numbers more accurately.", "D reported feeling more anxious."),
          answer: ["B"],
          explanation: "'produced significantly more ideas, and their ideas were judged to be more original'.",
        },
        {
          n: 33,
          prompt: "Why does the writer mention the electric shock study?",
          options: abc("A to show that the research methods were unethical", "B to illustrate how uncomfortable many people find being alone with their thoughts", "C to explain how boredom affects the brain", "D to suggest that people enjoy pain"),
          answer: ["B"],
          explanation: "Participants preferred 'an unpleasant sensation to no sensation at all'.",
        },
        {
          n: 34,
          prompt: "According to the passage, the 'default mode network'",
          options: abc("A is only active during sleep.", "B prevents people from daydreaming.", "C becomes more active when attention is not focused on a task.", "D was discovered by Sandi Mann."),
          answer: ["C"],
          explanation: "'When we are not focused on an external task… becomes more active.'",
        },
        {
          n: 35,
          prompt: "What is the writer's main purpose in the passage?",
          options: abc("A to argue that boredom can be valuable if we respond to it well", "B to warn that boredom is becoming a serious illness", "C to compare different theories of creativity", "D to describe the history of research into boredom"),
          answer: ["A"],
          explanation: "The conclusion: 'treat it as information'; a little boredom may be 'a price worth paying'.",
        },
      ],
    },
    {
      id: "r3-endings",
      type: "matching",
      instructions: "Questions 36–40. Complete each sentence with the correct ending, A–G, below.",
      title: "List of endings",
      options: abc(
        "is associated with poor mental and physical health.",
        "regarded boredom as a serious danger.",
        "the current activity is not meeting a person's needs.",
        "is more common among younger people.",
        "prevents boredom from serving its purpose.",
        "may return to a problem with fresh ideas.",
        "should be removed from schools and workplaces.",
      ),
      questions: [
        { n: 36, prompt: "Researchers now see boredom as a signal that", answer: ["C"], explanation: "'what we are currently doing does not satisfy our need for meaningful engagement'." },
        { n: 37, prompt: "Filling every spare moment with digital entertainment", answer: ["E"], explanation: "'boredom never has the chance to do its job'." },
        { n: 38, prompt: "Chronic boredom, unlike occasional boredom,", answer: ["A"], explanation: "'associated with depression, anxiety, overeating and risky behaviour'." },
        { n: 39, prompt: "People whose minds wander during simple activities", answer: ["F"], explanation: "Solutions often come 'while… walking or washing up'." },
        { n: 40, prompt: "Kierkegaard", answer: ["B"], explanation: "He called boredom 'the root of all evil'." },
      ],
    },
  ],
};
