import { gap, mcq, tf } from "../helpers";
import type { Checkpoint } from "../types";

/**
 * General English end-of-stage checkpoints for Stages 3–7 ("g3-checkpoint" … "g7-checkpoint").
 * A learner whose goals leave out IELTS takes these instead of the IELTS-format checkpoints; passing
 * either one opens the next stage. Original texts and recordings, no exam framing, the same four
 * skills and the same pass mark as the stage's own checkpoint.
 */
export const generalCheckpoints: Checkpoint[] = [
  // ---------------------------------------------------------------- Stage 3 (A2 → B1)
  {
    id: "g3-checkpoint",
    stage: 3,
    title: "Approach Checkpoint",
    reading: {
      title: "The Garden on Mill Street",
      timeMinutes: 15,
      paragraphs: [
        "Three years ago, the empty land behind the bus station on Mill Street was full of rubbish. Today it is a community garden with forty small beds, two apple trees and a wooden shed for tools. Anyone who lives in the area can ask for a bed, and the waiting list is now longer than the list of gardeners.",
        "The garden started with one person. Nadia Haddad, a retired science teacher, wrote to the town council and asked if local people could use the land. The council agreed, but only for one year at first. Nadia put a notice in the library and twelve people came to the first meeting. They spent their first spring clearing the ground and carrying away more than two hundred bags of rubbish.",
        "Now the gardeners meet every Saturday morning. They share seeds, fix the fence and drink tea together. Some of them grow vegetables for their families, and others grow flowers. Every September they hold a small market and give the money to the school next door, so the children can buy books.",
        "Not everything has been easy. In the second summer there was very little rain, and the gardeners had to carry water from their homes. After that, they collected money to buy a large water tank. Nadia says the dry summer taught everyone an important lesson: a garden needs a plan, not just good weather.",
        "The council has now agreed that the garden can stay for ten more years.",
      ],
      questions: [
        tf("cq1", "The land on Mill Street was empty and dirty before the garden started.", "TRUE", "'the empty land… was full of rubbish'."),
        tf("cq2", "Nadia Haddad used to work as a teacher.", "TRUE", "She is 'a retired science teacher'."),
        tf("cq3", "The council gave the gardeners the land for ten years at the beginning.", "FALSE", "At first it was 'only for one year'; ten more years came later."),
        tf("cq4", "Most of the gardeners are retired.", "NOT GIVEN", "The text doesn't say how old the gardeners are or whether they work."),
        mcq("cq5", "What happens to the money from the September market?", ["It pays for new seeds.", "It goes to the school next door.", "It pays the council for the land."], 1, "'give the money to the school next door, so the children can buy books'."),
        mcq("cq6", "Why did the gardeners buy a water tank?", ["Because the council asked them to.", "Because a dry summer made watering difficult.", "Because the apple trees needed more water."], 1, "'very little rain… After that, they collected money to buy a large water tank'."),
        gap("cq7", "In their first spring, the gardeners took away more than two hundred bags of ___.", ["rubbish"], "'carrying away more than two hundred bags of rubbish'."),
      ],
    },
    listening: {
      rate: 0.9,
      context: "A woman phones a sports centre to ask about swimming lessons for her son.",
      script: [
        { speaker: "Receptionist", voice: "male", text: "Good morning, Riverside Sports Centre. How can I help?" },
        { speaker: "Caller", voice: "female", text: "Hi. I'd like some information about swimming lessons for my son. He's eight, and he can't swim yet." },
        { speaker: "Receptionist", voice: "male", text: "No problem. We have a beginners' class for children aged seven to ten. It's on Tuesdays and Thursdays." },
        { speaker: "Caller", voice: "female", text: "What time does it start? He finishes school at three." },
        { speaker: "Receptionist", voice: "male", text: "The Tuesday class starts at half past four, and the Thursday class starts at five. Each lesson is forty-five minutes." },
        { speaker: "Caller", voice: "female", text: "Thursday is better for us. How much does it cost?" },
        { speaker: "Receptionist", voice: "male", text: "It's sixty pounds for a course of ten lessons. If you're a member of the centre, it's fifty." },
        { speaker: "Caller", voice: "female", text: "We're not members. Does he need to bring anything?" },
        { speaker: "Receptionist", voice: "male", text: "Just a towel and swimming goggles. And please arrive ten minutes early for the first lesson, because the teacher checks every child's level." },
        { speaker: "Caller", voice: "female", text: "Great. When does the next course start?" },
        { speaker: "Receptionist", voice: "male", text: "On the twelfth of March. Can I take your name?" },
        { speaker: "Caller", voice: "female", text: "Yes, it's Laila Mansour. That's M-A-N-S-O-U-R." },
      ],
      questions: [
        gap("cl1", "Class chosen: ___", ["Thursday", "Thursdays"], "'Thursday is better for us.'"),
        gap("cl2", "The Thursday class starts at ___ o'clock.", ["5", "five"], "'the Thursday class starts at five'."),
        gap("cl3", "Each lesson lasts ___ minutes.", ["45", "forty-five"], "'Each lesson is forty-five minutes.'"),
        gap("cl4", "Price for non-members: £___", ["60", "sixty"], "'sixty pounds for a course of ten lessons'. They are not members."),
        gap("cl5", "Bring a towel and swimming ___", ["goggles"], "'Just a towel and swimming goggles.'"),
        gap("cl6", "Family name: ___", ["Mansour"], "She spells it: M-A-N-S-O-U-R."),
      ],
    },
    writing: {
      task: "task2",
      prompt:
        "Your town wants to make one change to help the people who live there: more parks, better buses, or a new sports centre. Which change do you think is best? Write to the town council. Give two reasons and an example for each. Write at least 120 words.",
      minWords: 120,
      timeMinutes: 25,
      tips: ["Start with your choice in one clear sentence.", "One paragraph for each reason, with an example.", "Finish politely: thank the council and repeat your choice."],
    },
    speaking: {
      part: 2,
      questions: ["Talk about a place in your town where you like to spend time."],
      cueCard: { topic: "Talk about a place in your town where you like to spend time.", bullets: ["where it is", "how often you go there", "what you do there", "and explain why you like it"] },
      prepSeconds: 60,
      speakSeconds: 90,
    },
  },

  // ---------------------------------------------------------------- Stage 4 (B1 → B1+)
  {
    id: "g4-checkpoint",
    stage: 4,
    title: "Base Camp Checkpoint",
    reading: {
      title: "Don't Throw It Away: Fix It",
      timeMinutes: 20,
      paragraphs: [
        "On the first Sunday of every month, the hall of a small church in the city centre fills with broken things. A toaster that no longer gets hot. A child's bicycle with a bent wheel. A jacket with a broken zip. Their owners carry them in, sit down at a long table and wait for one of the volunteers to have a look. This is a repair café, and there are now more than a thousand of them in different countries around the world.",
        "The idea is simple. Volunteers with practical skills, such as electricians, tailors and people who are good with bicycles, offer their time for free. Visitors bring their broken items and, if possible, help with the repair themselves. Nobody pays for the work, although most cafés have a box for donations and a table with tea and cake.",
        "Tom Fielding, who has run the café in this hall for four years, says that about two out of three items are fixed on the day. 'Some things just need a new fuse or a bit of glue,' he explains. 'Others are harder, because the company that made them doesn't sell the parts, or the item is designed to be opened only in a factory. That's the most frustrating part of the job.'",
        "For many visitors, saving money is the main reason to come. A new toaster may not be expensive, but repairing the old one costs nothing. For others, the reason is the environment: every item that is fixed is one less item in a rubbish tip. However, Tom believes the most important result is something else. 'People learn that they can do it,' he says. 'Someone who watched us change a plug last month comes back and changes it themselves. That's when I know the café is working.'",
        "Repair cafés also bring together people who would not usually meet. Retired engineers sit next to students; neighbours who have never spoken find themselves sharing a screwdriver. Several cafés have started evening classes in basic repairs because so many visitors asked for them.",
        "Not everyone is a fan. Some shop owners worry that free repairs take business away from them. Tom disagrees. 'We send people to local repair shops all the time when a job needs special tools,' he says. 'We're not competing with anyone. We're just trying to change the habit of throwing things away.'",
      ],
      questions: [
        tf("cq1", "Repair cafés exist only in one country.", "FALSE", "'more than a thousand of them in different countries'."),
        tf("cq2", "Visitors must pay a small amount for each repair.", "FALSE", "'Nobody pays for the work', although there is a donation box."),
        tf("cq3", "Tom Fielding is a trained electrician.", "NOT GIVEN", "We know he runs the café, not what his job or training is."),
        mcq("cq4", "According to Tom, what makes some repairs difficult?", ["Visitors don't explain the problem clearly.", "Parts are not sold or items are hard to open.", "The volunteers don't have enough time."], 1, "'the company… doesn't sell the parts, or the item is designed to be opened only in a factory'."),
        mcq("cq5", "What does Tom think is the most important result of the café?", ["People save money.", "Less rubbish goes to the tip.", "People learn to repair things themselves."], 2, "'the most important result is something else. People learn that they can do it'."),
        mcq("cq6", "How does Tom answer the shop owners who are worried?", ["He says the café sends customers to local shops.", "He agrees to close the café on Saturdays.", "He says shops should offer free repairs too."], 0, "'We send people to local repair shops all the time'."),
        gap("cq7", "About ___ out of three items are fixed on the day.", ["two"], "'about two out of three items are fixed on the day'."),
        gap("cq8", "Several cafés now run evening ___ in basic repairs.", ["classes"], "'Several cafés have started evening classes in basic repairs'."),
      ],
    },
    listening: {
      context: "Two friends, Omar and Grace, plan a weekend trip to the coast.",
      script: [
        { speaker: "Grace", voice: "female", text: "So, are we still going to the coast this weekend? I've been looking forward to it all week." },
        { speaker: "Omar", voice: "male", text: "Definitely. I checked the trains last night. There's one at eight fifteen on Saturday morning that gets in just before ten." },
        { speaker: "Grace", voice: "female", text: "Eight fifteen is a bit early for a Saturday. Isn't there a later one?" },
        { speaker: "Omar", voice: "male", text: "There's one at eleven, but then we'd lose half the day. And the early train is cheaper: twenty-two pounds return instead of thirty-five." },
        { speaker: "Grace", voice: "female", text: "OK, you've convinced me. The early one. Where are we going to stay?" },
        { speaker: "Omar", voice: "male", text: "I found a small guesthouse near the harbour. It's called The Anchor. A double room is seventy pounds a night, and breakfast is included." },
        { speaker: "Grace", voice: "female", text: "That sounds lovely. Did you book it?" },
        { speaker: "Omar", voice: "male", text: "Not yet. I wanted to ask you first. They said they only have two rooms left, so I'll call them this afternoon." },
        { speaker: "Grace", voice: "female", text: "What about Saturday afternoon? I'd love to walk along the cliffs if the weather's good." },
        { speaker: "Omar", voice: "male", text: "Me too. The forecast says sunshine on Saturday but rain on Sunday, so let's do the cliff walk first. It's about eight kilometres to the lighthouse and back." },
        { speaker: "Grace", voice: "female", text: "And if it rains on Sunday, we could visit the museum. I read that it has an exhibition about old shipwrecks." },
        { speaker: "Omar", voice: "male", text: "Perfect. And we should try the fish restaurant my sister recommended. She said we need to book a table because it gets busy." },
        { speaker: "Grace", voice: "female", text: "I'll do that, then. You call the guesthouse, I'll call the restaurant." },
      ],
      questions: [
        gap("cl1", "Train chosen: leaves at ___ on Saturday.", ["8.15", "8:15", "eight fifteen"], "'There's one at eight fifteen… The early one.'"),
        gap("cl2", "Return ticket on the early train: £___", ["22", "twenty-two"], "'twenty-two pounds return instead of thirty-five'."),
        gap("cl3", "Name of the guesthouse: The ___", ["Anchor"], "'It's called The Anchor.'"),
        mcq("cl4", "Why hasn't Omar booked the guesthouse yet?", ["It was full.", "He wanted to ask Grace first.", "He couldn't get through on the phone."], 1, "'Not yet. I wanted to ask you first.'"),
        mcq("cl5", "Why will they do the cliff walk on Saturday?", ["Rain is expected on Sunday.", "The museum is closed on Saturday.", "The lighthouse opens only on Saturdays."], 0, "'sunshine on Saturday but rain on Sunday, so let's do the cliff walk first'."),
        mcq("cl6", "Who will phone the restaurant?", ["Omar", "Grace", "Omar's sister"], 1, "Grace: 'I'll call the restaurant.'"),
        gap("cl7", "The cliff walk is about ___ kilometres there and back.", ["8", "eight"], "'about eight kilometres to the lighthouse and back'."),
      ],
    },
    writing: {
      task: "task2",
      prompt:
        "A friend says: 'It's cheaper and easier to buy new things than to repair old ones.' Do you agree? Write an article for a community website. Explain your opinion, give examples from your own life, and suggest one thing people could do differently. Write at least 150 words.",
      minWords: 150,
      timeMinutes: 30,
      tips: ["A short title and an opening that makes people want to read.", "Give your opinion early, then support it with real examples.", "End with your suggestion in a clear final paragraph."],
    },
    speaking: {
      part: 3,
      questions: [
        "Do people in your country usually repair things, or buy new ones? Why?",
        "Why do you think many things today are difficult to repair?",
        "What practical skills should every young person learn? Why?",
      ],
      prepSeconds: 20,
      speakSeconds: 60,
    },
  },

  // ---------------------------------------------------------------- Stage 5 (B1+ → B2)
  {
    id: "g5-checkpoint",
    stage: 5,
    title: "The Ridge Checkpoint",
    reading: {
      title: "Why We Put Things Off",
      timeMinutes: 25,
      paragraphs: [
        "Almost everyone has done it. You sit down to write a report, answer a difficult email or start revising for a test, and twenty minutes later you are tidying your desk, checking the news or watching a video about how bridges are built. You know the task is important. You know that leaving it until later will only make things worse. And yet you put it off anyway.",
        "For a long time, procrastination was seen as a problem of time management, or simply as laziness. If people could only plan their days better, the thinking went, they would get their work done. More recent research suggests a different explanation. According to many psychologists, procrastination is less about time and more about feelings. We avoid a task not because we are lazy, but because it makes us feel something unpleasant: boredom, anxiety, confusion, or the fear that we will not do it well.",
        "Seen in this way, putting a task off is a kind of short-term repair for our mood. Turning to something easier makes us feel better immediately. The problem is that the relief does not last. The task is still waiting, the deadline is closer, and now we also feel guilty. That guilt makes the task even more unpleasant to think about, which makes us more likely to avoid it again. The result is a cycle that can be hard to break.",
        "This explanation also helps to show why some common advice does not work. Telling a procrastinator to 'just get on with it' is a bit like telling a nervous person to 'just relax'. Buying a new planner or downloading another productivity app may help for a few days, but if the unpleasant feelings remain, the old habits usually return.",
        "So what does help? One approach is to make the first step so small that it no longer feels threatening. Instead of 'write the report', the task becomes 'open the document and write the title'. Once people have started, they often find it easier to continue. Another approach is to be kinder to ourselves. In one well-known study, students who forgave themselves for procrastinating before one exam procrastinated less before the next one. It seems that guilt, rather than pushing us forward, often holds us back.",
        "Some researchers also recommend paying attention to the moment of avoidance. When you notice that you are about to switch to something else, it can be useful to stop and name the feeling: 'This is boring', or 'I'm worried this won't be good enough'. Naming a feeling does not make it disappear, but it can make it easier to choose what to do next.",
        "None of this means that procrastination is always harmless, or that it can be solved overnight. For some people it is linked to deeper problems with stress or attention, and they may need more support. But for most of us, understanding that we are avoiding a feeling, not the task itself, is a useful first step. And perhaps the best time to take that step is now, before you find something else to do.",
      ],
      questions: [
        tf("cq1", "In the past, procrastination was often explained as a problem with planning.", "TRUE", "'procrastination was seen as a problem of time management'."),
        tf("cq2", "According to recent research, people who procrastinate are usually lazy.", "FALSE", "Research suggests it is 'less about time and more about feelings… not because we are lazy'."),
        tf("cq3", "Procrastination is more common among students than among office workers.", "NOT GIVEN", "The text gives no comparison between groups."),
        mcq("cq4", "Why does the writer call putting a task off 'a short-term repair for our mood'?", ["It helps us plan our time better.", "It makes us feel better for a moment.", "It helps us finish the task faster."], 1, "'Turning to something easier makes us feel better immediately… the relief does not last'."),
        mcq("cq5", "What point does the writer make about productivity apps?", ["They are the most effective solution.", "They rarely help if the feelings stay the same.", "They make procrastination worse."], 1, "'may help for a few days, but if the unpleasant feelings remain, the old habits usually return'."),
        mcq("cq6", "What did the study of students suggest?", ["Forgiving yourself can reduce procrastination.", "Students need stricter deadlines.", "Guilt helps people work harder."], 0, "Students who forgave themselves 'procrastinated less before the next one'."),
        mcq("cq7", "What is the writer's main purpose?", ["To criticise people who procrastinate.", "To explain procrastination and suggest ways to reduce it.", "To advertise a new productivity method."], 1, "The article explains the causes and then asks 'So what does help?'."),
        gap("cq8", "One idea is to make the first step so small that it no longer feels ___.", ["threatening"], "'make the first step so small that it no longer feels threatening'."),
      ],
    },
    listening: {
      context: "A local radio programme talks to a city planner and a cyclist about a plan to close a street to cars.",
      script: [
        { speaker: "Presenter", voice: "female", text: "Good evening. Tonight we're talking about the council's plan to close King Street to cars for a one-year trial. With me are Daniel Okafor, a city planner, and Mei Lin, who cycles to work every day. Daniel, first of all, why King Street?" },
        { speaker: "Daniel", voice: "male", text: "King Street is one of the busiest shopping streets in the city, but it's also very narrow. At the moment, cars, buses, bikes and people on foot all compete for the same space, and frankly, nobody's happy. We counted the traffic last spring, and about three quarters of the people in the street were walking. Yet most of the space is given to cars." },
        { speaker: "Presenter", voice: "female", text: "Mei, you cycle through King Street every day. What's it like?" },
        { speaker: "Mei", voice: "female", text: "Honestly, it's the most stressful part of my journey. Cars park on the cycle lane all the time, so I have to move out into the traffic. A lot of my colleagues would like to cycle, but they tell me they don't feel safe. So I'm very much in favour of the trial." },
        { speaker: "Presenter", voice: "female", text: "But not everyone agrees. Some shop owners say that if customers can't drive, they won't come. Daniel, what's your answer to that?" },
        { speaker: "Daniel", voice: "male", text: "It's a fair worry, and we're taking it seriously. But when other cities have done something similar, the results have usually been positive for shops. People who walk or cycle tend to visit more often, even if they spend a little less each time. That said, every city is different, which is exactly why this is a trial and not a permanent decision." },
        { speaker: "Presenter", voice: "female", text: "What about people who need a car? Older people, or people with disabilities?" },
        { speaker: "Daniel", voice: "male", text: "Delivery vans will still be allowed before ten in the morning, and blue badge holders will still be able to drive to the special parking spaces at both ends of the street. We're also adding a new bus stop on Market Road, which is only two minutes' walk away." },
        { speaker: "Mei", voice: "female", text: "Can I add something? I think the important thing is that the council listens during the trial. If something isn't working, change it. People will accept a change much more easily if they feel their opinion matters." },
        { speaker: "Daniel", voice: "male", text: "I completely agree. We'll publish the traffic and shop data every three months, and there will be an online survey that anyone can fill in." },
        { speaker: "Presenter", voice: "female", text: "And when does the trial begin?" },
        { speaker: "Daniel", voice: "male", text: "On the first of June, if the council approves it next week." },
      ],
      questions: [
        gap("cl1", "The trial will last one ___.", ["year"], "'close King Street to cars for a one-year trial'."),
        mcq("cl2", "What did the traffic count show?", ["Most people in the street were on foot.", "Most people in the street were in cars.", "The number of cyclists had doubled."], 0, "'about three quarters of the people in the street were walking'."),
        mcq("cl3", "Why does Mei find King Street stressful?", ["The buses are too fast.", "Cars park on the cycle lane.", "The street is too dark at night."], 1, "'Cars park on the cycle lane all the time, so I have to move out into the traffic.'"),
        mcq("cl4", "What does Daniel say about shops in other cities?", ["They usually lost customers.", "The results have usually been good for them.", "Most of them moved to other streets."], 1, "'the results have usually been positive for shops'."),
        gap("cl5", "Delivery vans can still use the street before ___ in the morning.", ["10", "ten"], "'Delivery vans will still be allowed before ten in the morning'."),
        gap("cl6", "A new bus stop will be added on ___ Road.", ["Market"], "'a new bus stop on Market Road'."),
        mcq("cl7", "What is Mei's main point near the end?", ["The trial should be longer.", "The council should listen and make changes.", "Shops should open later."], 1, "'the important thing is that the council listens during the trial. If something isn't working, change it.'"),
        gap("cl8", "The data will be published every ___ months.", ["3", "three"], "'We'll publish the traffic and shop data every three months'."),
      ],
    },
    writing: {
      task: "task2",
      prompt:
        "Your city is thinking about closing its main shopping street to cars. Write a letter to the local newspaper giving your opinion. Consider the advantages and disadvantages for different groups of people (shop owners, older people, families, cyclists) and say what you think the city should do. Write at least 180 words.",
      minWords: 180,
      timeMinutes: 35,
      tips: ["Make your position clear in the first paragraph.", "Show you understand the other side, then explain why your view is stronger.", "Use linkers of contrast: however, although, on the other hand."],
    },
    speaking: {
      part: 2,
      questions: ["Talk about a habit you would like to change, or one you have already changed."],
      cueCard: {
        topic: "Talk about a habit you would like to change, or one you have already changed.",
        bullets: ["what the habit is", "how long you have had it", "what you have tried to do about it", "and explain how changing it would make (or has made) a difference"],
      },
      prepSeconds: 60,
      speakSeconds: 120,
    },
  },

  // ---------------------------------------------------------------- Stage 6 (B2 → C1)
  {
    id: "g6-checkpoint",
    stage: 6,
    title: "High Camp Checkpoint",
    reading: {
      title: "The Hottest Place in Town",
      timeMinutes: 30,
      paragraphs: [
        "On a summer afternoon, the temperature in the centre of a large city can be several degrees higher than in the countryside just a few kilometres away. The difference is often greatest at night, when the countryside cools quickly but the city goes on releasing the heat it has stored during the day. Scientists call this the urban heat island effect, and as summers become hotter, it is turning from a curiosity into a serious problem for public health.",
        "The causes are well understood. Cities replace fields and forests with materials such as concrete, brick and asphalt, which absorb the sun's energy and release it slowly. Dark roofs and roads are especially effective at trapping heat. Tall buildings that stand close together reduce the wind that would otherwise carry warm air away, and they reflect sunlight back and forth between them instead of letting it escape. On top of this, cities produce heat of their own: from traffic, from industry, and, increasingly, from the air-conditioning units that people install to escape the heat, which push warm air out into the street.",
        "The consequences are not shared equally. Within the same city, temperatures can vary considerably from one neighbourhood to another. Areas with plenty of trees, parks and water tend to be cooler, while densely built districts with little greenery can be much hotter. Researchers in several countries have found that these hotter districts are often the ones where people on lower incomes live, in older housing that is poorly insulated and where air-conditioning may be unaffordable. During heatwaves, older people, young children and people who work outdoors face the greatest risks.",
        "Because the causes are local, many of the solutions are local too. The most familiar is planting trees. A mature tree cools the air around it in two ways: by providing shade, and by releasing water vapour through its leaves, which works rather like sweating. Parks, green roofs and walls covered in plants have a similar, if smaller, effect. Some cities have gone further, painting roofs and even roads in light colours that reflect more sunlight. Early results from these projects are promising, although critics point out that reflected light can make streets uncomfortably bright and that light-coloured surfaces need regular cleaning to stay effective.",
        "Such measures are not cheap, and they take time. A newly planted tree may need twenty years or more to provide meaningful shade, and in many city centres there is simply little space for planting. Underground pipes and cables make it difficult to dig, and land is expensive. For this reason, some planners argue that the most important decisions are not about individual trees but about how new districts are designed in the first place: how wide the streets are, which direction they face, how buildings are spaced, and how much ground is left unsealed so that rainwater can soak in.",
        "There is also a growing recognition that technical solutions alone are not enough. Cooling centres, where people can spend the hottest hours of the day, early-warning systems that alert people before a heatwave, and simple measures such as checking on elderly neighbours can all save lives. Several cities have appointed officials whose only job is to coordinate their response to heat.",
        "Cities will not stop being warmer than the countryside, and there is no single measure that can remove the effect entirely. Yet the evidence suggests that a combination of greener streets, smarter design and better preparation can make a real difference, and that the cost of doing nothing will keep rising with the temperature.",
      ],
      questions: [
        tf("cq1", "The difference in temperature between city and countryside is often largest at night.", "TRUE", "'The difference is often greatest at night'."),
        tf("cq2", "Air-conditioning helps to reduce the temperature of city streets.", "FALSE", "Air-conditioning units 'push warm air out into the street'."),
        tf("cq3", "Green roofs cool the air more effectively than mature trees.", "FALSE", "Green roofs have 'a similar, if smaller, effect'."),
        tf("cq4", "Light-coloured roads have been banned in some countries.", "NOT GIVEN", "The text mentions criticism but nothing about bans."),
        mcq("cq5", "According to the third paragraph, which neighbourhoods are often hottest?", ["Those near rivers and parks.", "Densely built areas where people on lower incomes often live.", "New districts on the edge of the city."], 1, "'densely built districts with little greenery… are often the ones where people on lower incomes live'."),
        mcq("cq6", "Why do some planners focus on the design of new districts?", ["Trees are too expensive to buy.", "Existing centres often lack space and trees take years to grow.", "Residents prefer modern buildings."], 1, "'A newly planted tree may need twenty years… there is simply little space'."),
        mcq("cq7", "What is the purpose of the sixth paragraph?", ["To argue that planting trees is a waste of money.", "To show that social measures are also needed.", "To describe the history of cooling centres."], 1, "'technical solutions alone are not enough' followed by social measures."),
        mcq("cq8", "Which best describes the writer's conclusion?", ["The problem can be solved completely with one measure.", "Several measures together can reduce the problem significantly.", "Cities should stop building new districts."], 1, "'a combination of greener streets, smarter design and better preparation can make a real difference'."),
        gap("cq9", "Trees cool the air by giving shade and by releasing water ___ through their leaves.", ["vapour"], "'by releasing water vapour through its leaves'."),
      ],
    },
    listening: {
      context: "Part of a podcast in which two guests discuss whether apps can replace classes for learning a language.",
      script: [
        { speaker: "Host", voice: "female", text: "Welcome back. My guests today are Dr Ruth Adeyemi, who researches how adults learn languages, and Karim Saleh, who taught himself Spanish mainly through apps. Karim, let's start with you. How far did the apps get you?" },
        { speaker: "Karim", voice: "male", text: "Further than I expected, actually. I used them every day for about two years, usually on the bus. My vocabulary grew enormously, and I could read simple articles quite comfortably. But the first time I tried to have a real conversation, in a café in Madrid, I completely froze. I understood maybe half of what the waiter said, and I couldn't put a sentence together quickly enough to reply." },
        { speaker: "Host", voice: "female", text: "Ruth, does that surprise you?" },
        { speaker: "Ruth", voice: "female", text: "Not at all. It's a very common experience. Most apps are excellent at what we call receptive knowledge: recognising words, understanding sentences when you have time to think. What they're much weaker at is giving you practice in producing language under pressure, in real time, with someone who doesn't wait for you. And that's a skill in its own right. It has to be practised, just like playing an instrument." },
        { speaker: "Host", voice: "female", text: "So should people stop using apps?" },
        { speaker: "Ruth", voice: "female", text: "No, and I'd be careful not to give that impression. The research suggests that regular, short practice, which is exactly what apps encourage, is very effective for building vocabulary. The problem is when people treat the app as the whole course rather than one part of it. Consistency is the apps' great strength. The danger is that you become very good at the app rather than at the language." },
        { speaker: "Karim", voice: "male", text: "That's exactly what happened to me. I had a three-hundred-day streak, and I was very proud of it. But I'd been choosing the easiest exercises to keep the streak going." },
        { speaker: "Host", voice: "female", text: "What did you change after Madrid?" },
        { speaker: "Karim", voice: "male", text: "I kept the app for vocabulary, but I found a conversation partner online, a teacher in Valencia, and we spoke twice a week for half an hour. The first month was painful, honestly. But after about three months, I noticed I was thinking less and just speaking." },
        { speaker: "Ruth", voice: "female", text: "That combination is close to what I'd recommend. Something for regular input and vocabulary, real conversation with feedback, and plenty of listening to natural speech: podcasts, films, whatever you enjoy. And I'd add one thing: don't be afraid of making mistakes. Learners who wait until they feel ready to speak often wait far too long." },
        { speaker: "Host", voice: "female", text: "Karim, any final advice for listeners?" },
        { speaker: "Karim", voice: "male", text: "Measure the right thing. Don't measure the days in your streak. Measure how long you can keep a conversation going." },
      ],
      questions: [
        mcq("cl1", "What happened when Karim first tried to have a conversation in Spanish?", ["He understood everything but spoke slowly.", "He understood only part of it and couldn't reply in time.", "The waiter answered him in English."], 1, "'I understood maybe half… couldn't put a sentence together quickly enough'."),
        mcq("cl2", "According to Ruth, what are most apps weakest at?", ["Teaching new vocabulary.", "Practice in speaking in real time.", "Helping learners to study regularly."], 1, "'much weaker at… producing language under pressure, in real time'."),
        mcq("cl3", "What does Ruth compare speaking practice to?", ["Playing an instrument.", "Learning to drive.", "Training for a race."], 0, "'It has to be practised, just like playing an instrument.'"),
        mcq("cl4", "What is Ruth's view of apps overall?", ["They should be avoided.", "They are useful as one part of learning.", "They are better than a teacher."], 1, "'The problem is when people treat the app as the whole course rather than one part of it.'"),
        gap("cl5", "Karim's streak reached ___ days.", ["300", "three hundred", "three-hundred"], "'I had a three-hundred-day streak'."),
        gap("cl6", "Karim's conversation partner was a teacher in ___.", ["Valencia"], "'a teacher in Valencia'."),
        gap("cl7", "They spoke twice a week for half an ___.", ["hour"], "'we spoke twice a week for half an hour'."),
        mcq("cl8", "What does Karim mean by 'Measure the right thing'?", ["Count the new words you learn each day.", "Judge your progress by how long you can keep a conversation going.", "Take a test every three months."], 1, "'Measure how long you can keep a conversation going.'"),
      ],
    },
    writing: {
      task: "task2",
      prompt:
        "'Technology makes it possible to learn almost anything on your own, so teachers are becoming less important.' Write an essay for an online magazine in which you discuss this view. Consider what technology does well and what it does less well, and give your own conclusion with reasons and examples. Write at least 220 words.",
      minWords: 220,
      timeMinutes: 40,
      tips: ["Present both sides fairly before you give your own view.", "Support each point with a specific example, not a general claim.", "Use hedging where you are not certain: tends to, in many cases, it could be argued."],
    },
    speaking: {
      part: 3,
      questions: [
        "What makes some people better at learning new skills than others?",
        "How has technology changed the way people learn in your country?",
        "Some people say mistakes are the best teacher. To what extent do you agree?",
        "What role should governments play in helping adults to keep learning?",
      ],
      prepSeconds: 20,
      speakSeconds: 75,
    },
  },

  // ---------------------------------------------------------------- Stage 7 (C1)
  {
    id: "g7-checkpoint",
    stage: 7,
    title: "The Summit Checkpoint",
    reading: {
      title: "What We Remember, and Why It Changes",
      timeMinutes: 35,
      paragraphs: [
        "Ask most people how memory works and they will describe something like a recording. Experiences are stored, the thinking goes, and remembering is simply a matter of finding the right file and pressing play. Some memories may be faded or hard to find, but those we can retrieve are assumed to be broadly accurate copies of what happened. It is an intuitive picture, and it is largely wrong.",
        "Decades of research have shown that memory is not so much retrieved as reconstructed. When we recall an event, the brain does not replay a stored copy; it rebuilds the experience from fragments, filling in gaps with what it expects, what it has learned since, and what makes sense of the story. Most of the time this process serves us well. It allows us to extract general lessons from particular experiences, and it saves the brain from having to store every detail of every moment. But it also means that memories can change, sometimes considerably, without our noticing.",
        "Some of the most influential evidence for this view came from experiments on eyewitness memory. In a series of now-classic studies, participants watched film of a traffic accident and were then asked questions about it. The wording of a single question made a measurable difference to what they reported. Those asked how fast the cars were going when they 'smashed into' each other gave higher estimates of speed than those asked about the cars that 'hit' each other, and a week later they were more likely to remember seeing broken glass, though there had been none. The information contained in the question had quietly become part of the memory.",
        "Later research went further, showing that it is possible, under certain conditions, to lead people to remember entire events that never took place. Participants who were repeatedly encouraged to imagine a childhood experience, and given apparently reliable confirmation that it had happened, sometimes came to describe it in vivid detail. Importantly, these false memories did not feel different from true ones. People were often just as confident about them, and sometimes more so.",
        "The implications for the justice system have been significant. Eyewitness testimony is persuasive in court precisely because a confident, sincere witness seems so credible. Yet confidence, the research suggests, is a poor guide to accuracy once a memory has been revisited many times, discussed with others, or shaped by the questions of investigators. In response, a number of police forces have changed the way they conduct interviews and identification procedures: asking open rather than leading questions, recording a witness's level of confidence at the first identification, before it can be inflated, and ensuring that the officer who runs a line-up does not know which person is the suspect.",
        "It would be a mistake, however, to conclude that memory is hopelessly unreliable. The central features of significant events are often remembered reasonably well; it is the peripheral details, the exact words, the sequence of events, the colour of a car, that are most vulnerable to change. Nor is reconstruction simply a flaw. Some researchers argue that the flexibility of memory is closely connected to our ability to imagine the future, since both depend on recombining elements of past experience into new scenarios. A memory system that preserved every experience unchanged might be more accurate, but it would also be far less useful for planning, problem-solving and learning.",
        "For most of us, the practical lessons are modest but worth taking seriously. Disagreements about who said what in an argument, or what really happened on a family holiday, may be less a matter of one person being dishonest than of two people sincerely reconstructing the past in different ways. Writing things down soon after they happen offers some protection, as does a degree of humility about our own certainty. When two accounts of the same event differ, it is often more productive to compare what each person actually saw and heard than to argue about whose memory is better, since neither memory is a perfect record and both may contain something true.",
        "Memory, in the end, is less like a recording than like a story we keep retelling. Each retelling keeps the story alive, but it also gives us the chance, and the risk, of telling it a little differently.",
      ],
      questions: [
        tf("cq1", "The writer believes the common view of memory as a recording is mostly accurate.", "FALSE", "'It is an intuitive picture, and it is largely wrong.'"),
        tf("cq2", "In the traffic accident studies, the verb used in a question affected how people remembered the event.", "TRUE", "'smashed into' produced higher speed estimates and false memories of broken glass."),
        tf("cq3", "People who hold false memories are usually less confident than people with true memories.", "FALSE", "'People were often just as confident about them, and sometimes more so.'"),
        tf("cq4", "All police forces now record a witness's confidence at the first identification.", "NOT GIVEN", "The text says 'a number of police forces', not all, and gives no figures."),
        mcq("cq5", "What does the writer mean by saying memory is 'reconstructed'?", ["It is stored in several different parts of the brain.", "It is rebuilt from fragments each time we remember.", "It is gradually lost as we grow older."], 1, "'the brain does not replay a stored copy; it rebuilds the experience from fragments'."),
        mcq("cq6", "Why have some police forces made sure the officer running a line-up does not know who the suspect is?", ["To save time during the investigation.", "To avoid influencing the witness.", "Because the law requires two officers."], 1, "The changes aim to stop the procedure from shaping the witness's memory."),
        mcq("cq7", "According to the sixth paragraph, which details are most likely to change?", ["The main features of important events.", "Minor details such as exact words and order of events.", "Memories of the recent past."], 1, "'it is the peripheral details, the exact words, the sequence of events… that are most vulnerable'."),
        mcq("cq8", "Why do some researchers see the flexibility of memory as useful?", ["It helps us forget unpleasant experiences.", "It is linked to our ability to imagine and plan for the future.", "It makes us more confident witnesses."], 1, "'closely connected to our ability to imagine the future'."),
        mcq("cq9", "What is the writer's attitude in the seventh paragraph?", ["Disagreements about the past are usually caused by lying.", "We should be more modest about how certain our memories are.", "Writing things down makes memories completely reliable."], 1, "'a degree of humility about our own certainty'. Writing things down offers only 'some protection'."),
        gap("cq10", "A week later, some participants remembered seeing broken ___, though there had been none.", ["glass"], "'more likely to remember seeing broken glass, though there had been none'."),
      ],
    },
    listening: {
      context: "An extract from a public talk followed by questions from the audience. The speaker is an economist discussing why people trust, or distrust, experts.",
      script: [
        { speaker: "Speaker", voice: "male", text: "It has become almost a cliché to say that we live in an age of distrust in experts. Surveys in many countries do suggest that confidence in institutions has fallen over recent decades. But I want to argue tonight that the picture is more complicated, and in some ways more hopeful, than the headlines suggest. People haven't stopped trusting experts. What they've become much more selective about is which experts they trust, and on what subjects." },
        { speaker: "Speaker", voice: "male", text: "Think about your own behaviour. Most of us still board planes without checking the engineering calculations ourselves. We take medicines prescribed by doctors whose training we've never examined. We trust experts constantly, mostly without noticing. Where trust breaks down tends to be in areas where expert advice touches on values, on how we ought to live, or where experts have visibly disagreed with each other, or where their predictions have publicly failed." },
        { speaker: "Speaker", voice: "male", text: "And here I'd like to make a slightly uncomfortable point for people in my own profession. Economists have, at times, presented forecasts with a confidence that the evidence didn't justify. When those forecasts turn out to be wrong, the damage isn't limited to that one prediction. People reasonably ask what else we were overconfident about. Being honest about uncertainty, saying 'we think this is likely, but here's what could change our view', is sometimes seen as weakness. I'd argue the opposite: over time, it's what makes trust possible." },
        { speaker: "Host", voice: "female", text: "Thank you. We have time for a couple of questions. Yes, the woman in the second row." },
        { speaker: "Audience member", voice: "female", text: "Thank you. You said experts should be honest about uncertainty. But don't people want clear answers? If an expert says 'it depends', won't people just listen to someone more confident, even if that person is wrong?" },
        { speaker: "Speaker", voice: "male", text: "That's a very good question, and the honest answer is: sometimes, yes. In the short term, confidence is persuasive. There's research showing that audiences often prefer a confident adviser to a cautious one. But there's also evidence that when a confident adviser is shown to be wrong, people punish that quite heavily, whereas a cautious adviser who turns out to be wrong loses much less credibility. So it depends on the time scale. I'd also say that 'it depends' is only unhelpful if you stop there. The useful thing is to say what it depends on." },
        { speaker: "Host", voice: "female", text: "One more. The gentleman at the back." },
        { speaker: "Audience member", voice: "male", text: "You've talked about what experts should do. What about the rest of us? How should an ordinary person decide whom to trust?" },
        { speaker: "Speaker", voice: "male", text: "I'd suggest three questions. First, does this person have a track record in this specific area, not just a general reputation? A brilliant physicist isn't automatically worth listening to on nutrition. Second, do they tell you what would change their mind? People who can't imagine being wrong are rarely the most reliable. And third, where there is a broad agreement among independent specialists, that agreement deserves more weight than any single voice, including mine. None of this is foolproof. But it's a great deal better than choosing whoever sounds most certain." },
      ],
      questions: [
        mcq("cl1", "What is the speaker's main argument?", ["People no longer trust experts at all.", "People trust experts selectively rather than not at all.", "Surveys about trust are unreliable."], 1, "'People haven't stopped trusting experts. What they've become much more selective about is which experts they trust'."),
        mcq("cl2", "Why does the speaker mention planes and medicines?", ["To show that we trust experts every day without noticing.", "To criticise the safety of air travel.", "To argue that doctors are more trusted than engineers."], 0, "'We trust experts constantly, mostly without noticing.'"),
        mcq("cl3", "Which is NOT given as an area where trust tends to break down?", ["Where advice touches on values.", "Where experts have disagreed publicly.", "Where experts are paid by the government."], 2, "He mentions values, disagreement and failed predictions, not payment."),
        mcq("cl4", "What criticism does the speaker make of economists?", ["They avoid making forecasts.", "They have sometimes been too confident.", "They speak in language that is too technical."], 1, "'presented forecasts with a confidence that the evidence didn't justify'."),
        mcq("cl5", "According to the speaker, what happens when a confident adviser is shown to be wrong?", ["People forgive them quickly.", "They lose a lot of credibility.", "People trust cautious advisers less."], 1, "'people punish that quite heavily'."),
        mcq("cl6", "What does the speaker say about the answer 'it depends'?", ["It should never be used.", "It is useful only if you explain what it depends on.", "It is the most honest answer an expert can give."], 1, "'it depends' is only unhelpful if you stop there. The useful thing is to say what it depends on.'"),
        mcq("cl7", "Why does he mention a brilliant physicist?", ["To show that expertise is specific to a field.", "To praise scientists in general.", "To give an example of a false prediction."], 0, "'A brilliant physicist isn't automatically worth listening to on nutrition.'"),
        mcq("cl8", "What does the speaker say about broad agreement among independent specialists?", ["It should count for more than any single voice.", "It is usually the result of pressure from governments.", "It is less reliable than one expert's track record."], 0, "'that agreement deserves more weight than any single voice, including mine'."),
      ],
    },
    writing: {
      task: "task2",
      prompt:
        "'People today have access to more information than ever before, yet they find it harder to know what to believe.' Write an essay in which you examine the reasons for this situation and evaluate what individuals and institutions could do about it. Support your argument with relevant examples. Write at least 250 words.",
      minWords: 250,
      timeMinutes: 45,
      tips: ["Plan before you write: a clear line of argument, not a list of ideas.", "Evaluate your solutions: say which would work best and why, and what their limits are.", "Vary your language: precise vocabulary, a range of structures, and careful hedging."],
    },
    speaking: {
      part: 3,
      questions: [
        "How do you decide whether a piece of news or advice is reliable?",
        "Is it ever right for experts to simplify complex information for the public? Why or why not?",
        "Some people argue that personal experience is a better guide than research. How would you respond?",
        "How might the way people find and trust information change over the next twenty years?",
      ],
      prepSeconds: 20,
      speakSeconds: 90,
    },
  },
];

export function getGeneralCheckpoint(id: string): Checkpoint | undefined {
  return generalCheckpoints.find((c) => c.id === id);
}
