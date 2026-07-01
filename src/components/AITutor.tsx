import { useMemo, useState } from 'react';
import { BookOpen, Check, MessageCircle, Mic, RotateCcw } from 'lucide-react';
import SpeechPractice from './SpeechPractice';
import VideoCallTrainer from './VideoCallTrainer';

type Props = { languages: string[]; onTrainingComplete: () => void };
type SituationId = 'greetings' | 'cafe' | 'school' | 'travel';
type WordPart = { word: string; meaning: string };
type Phrase = {
  text: string;
  sound: string;
  translation: string;
  words: WordPart[];
};
type PhraseSet = Record<SituationId, Phrase[]>;
const situations: Array<{ id: SituationId; label: string }> = [
  { id: 'greetings', label: 'Meet people' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'school', label: 'School' },
  { id: 'travel', label: 'Travel' },
];

const lessonTitles: Record<SituationId, { title: string; goal: string }> = {
  greetings: { title: 'Meet people', goal: 'Say hello, introduce yourself, and answer simply.' },
  cafe: { title: 'Cafe', goal: 'Order food or a drink politely.' },
  school: { title: 'School', goal: 'Ask for help and talk about learning.' },
  travel: { title: 'Travel', goal: 'Ask where something is and move around a city.' },
};
const phraseBank: Record<string, PhraseSet> = {
  English: {
    greetings: [
      phrase('Hello, my name is Alex.', 'heh-loh, my naym iz Alex', 'Привет, меня зовут Алекс.', [['Hello', 'привет'], ['my name is', 'меня зовут'], ['Alex', 'Алекс']]),
      phrase('Nice to meet you.', 'nys tuh meet yoo', 'Приятно познакомиться.', [['Nice', 'приятно'], ['to meet', 'познакомиться'], ['you', 'с тобой']]),
    ],
    cafe: [
      phrase('I would like water, please.', 'ai wood laik waw-ter pleez', 'Я бы хотел воды, пожалуйста.', [['I would like', 'я бы хотел'], ['water', 'вода'], ['please', 'пожалуйста']]),
      phrase('How much is it?', 'hau much iz it', 'Сколько это стоит?', [['How much', 'сколько'], ['is', 'есть/стоит'], ['it', 'это']]),
    ],
    school: [
      phrase('Can you help me?', 'kan yoo help mee', 'Можешь помочь мне?', [['Can you', 'можешь ли ты'], ['help', 'помочь'], ['me', 'мне']]),
      phrase('I do not understand yet.', 'ai do not un-der-stand yet', 'Я пока не понимаю.', [['I', 'я'], ['do not understand', 'не понимаю'], ['yet', 'пока']]),
    ],
    travel: [
      phrase('Where is the station?', 'wehr iz thuh stay-shun', 'Где станция?', [['Where', 'где'], ['is', 'находится'], ['the station', 'станция']]),
      phrase('I need a ticket.', 'ai need uh tik-it', 'Мне нужен билет.', [['I need', 'мне нужен'], ['a ticket', 'билет']]),
    ],
  },
  Spanish: simpleLesson('Hola, me llamo Alex.', 'OH-lah, meh YAH-moh Alex', 'Quiero agua, por favor.', 'kee-EH-roh AH-gwah por fah-VOR', 'Puedes ayudarme?', 'PWEH-des ah-yoo-DAR-meh', 'Donde esta la estacion?', 'DON-deh es-TAH lah es-tah-see-ON'),
  French: simpleLesson('Bonjour, je m appelle Alex.', 'bon-ZHOOR, zhuh mah-PELL Alex', 'Je voudrais de l eau, s il vous plait.', 'zhuh voo-DREH duh loh seel voo PLEH', 'Pouvez-vous m aider?', 'poo-VAY voo meh-DAY', 'Ou est la gare?', 'oo eh lah gar'),
  German: simpleLesson('Hallo, ich heisse Alex.', 'HAH-loh ikh HAI-seh Alex', 'Ich mochte Wasser, bitte.', 'ikh MURKH-tuh VAH-ser BIT-tuh', 'Kannst du mir helfen?', 'kanst doo meer HEL-fen', 'Wo ist der Bahnhof?', 'voh ist der BAHN-hof'),
  Portuguese: simpleLesson('Ola, eu me chamo Alex.', 'oh-LAH, eh-oo mee SHAH-moo Alex', 'Eu quero agua, por favor.', 'eh-oo KEH-roh AH-gwah por fah-VOR', 'Voce pode me ajudar?', 'voh-SEH POH-jeh mee ah-joo-DAR', 'Onde fica a estacao?', 'ON-jee FEE-kah ah es-tah-SOW'),
  Italian: simpleLesson('Ciao, mi chiamo Alex.', 'chow, mee KYAH-moh Alex', 'Vorrei acqua, per favore.', 'vor-RAY AH-kwah per fah-VOH-reh', 'Puoi aiutarmi?', 'PWOY ah-yoo-TAR-mee', 'Dov e la stazione?', 'doh-VEH lah stah-TSYOH-neh'),
  Russian: simpleLesson('Privet, menya zovut Alex.', 'pree-VYET, mee-NYA zah-VOOT Alex', 'Ya khochu vody, pozhaluysta.', 'yah khoh-CHOO vah-DY pah-ZHAH-loo-stah', 'Mozhesh pomoch mne?', 'MOH-zhesh pah-MOHCH mnye', 'Gde vokzal?', 'gdye vahg-ZAL'),
  Kazakh: simpleLesson('Salem, menin atym Alex.', 'sah-LEM, meh-NEEN ah-TYM Alex', 'Magan su kerek, otinemin.', 'mah-GAHN soo keh-REK, oh-tee-neh-MEEN', 'Magan komektese alasyz ba?', 'mah-GAHN kuh-MEK-teh-seh ah-lah-SYZ bah', 'Beket qaida?', 'beh-KET kai-DAH'),
  Japanese: simpleLesson('Konnichiwa, Alex desu.', 'kon-nee-chee-wah, Alex dess', 'Mizu o kudasai.', 'mee-zoo oh koo-dah-sai', 'Tetsudatte kuremasu ka?', 'teh-tsoo-dah-teh koo-reh-mah-soo kah', 'Eki wa doko desu ka?', 'eh-kee wah doh-koh dess kah'),
  Chinese: simpleLesson('Ni hao, wo jiao Alex.', 'nee how, woh jyow Alex', 'Wo yao shui, xiexie.', 'woh yow shway, shyeh-shyeh', 'Ni neng bang wo ma?', 'nee nung bahng woh mah', 'Chezhan zai nali?', 'chuh-jahn dzai nah-lee'),
  Korean: simpleLesson('Annyeonghaseyo, je ireumeun Alex imnida.', 'ahn-nyong-hah-seh-yoh, jee ee-ruh-mun Alex im-nee-dah', 'Mul juseyo.', 'mool joo-seh-yoh', 'Dowa jusil su innayo?', 'doh-wah joo-sheel soo een-nah-yoh', 'Yeogi eodi yeyo?', 'yoh-gee oh-dee yeh-yoh'),
  Arabic: simpleLesson('Marhaba, ismi Alex.', 'mar-ha-bah, is-mee Alex', 'Ureed maa, min fadlak.', 'oo-reed maa, min fad-lak', 'Hal yumkinuka musa adati?', 'hal yoom-kee-noo-kah moo-sah-ah-dah-tee', 'Ayna al-mahatta?', 'ay-nah al-ma-hat-tah'),
};
const extraPracticePhrases: PhraseSet = {
  greetings: [phrase('How are you today?', 'hau ar yoo tuh-day', 'How are you today?', [['How', 'how'], ['are you', 'you feel'], ['today', 'today']]), phrase('I am happy to talk with you.', 'ai am hap-ee tuh tawk with yoo', 'I am happy to talk with you.', [['I am', 'I feel'], ['happy', 'good'], ['to talk', 'speak'], ['with you', 'with you']]), phrase('What do you like to do?', 'wut doo yoo laik tuh doo', 'What do you like to do?', [['What', 'question'], ['do you like', 'you enjoy'], ['to do', 'activity']])],
  cafe: [phrase('Can I see the menu?', 'kan ai see thuh men-yoo', 'Can I see the menu?', [['Can I', 'request'], ['see', 'look at'], ['the menu', 'food list']]), phrase('The food is very good.', 'thuh food iz veh-ree good', 'The food is very good.', [['The food', 'meal'], ['is', 'equals'], ['very good', 'great']]), phrase('I would like the bill, please.', 'ai wood laik thuh bill pleez', 'I would like the bill, please.', [['I would like', 'polite want'], ['the bill', 'payment paper'], ['please', 'polite word']])],
  school: [phrase('Please say it again.', 'pleez say it uh-gen', 'Please say it again.', [['Please', 'polite word'], ['say', 'speak'], ['again', 'one more time']]), phrase('I have a question.', 'ai hav uh kwes-chun', 'I have a question.', [['I have', 'I own'], ['a question', 'something to ask']]), phrase('Can you speak slowly?', 'kan yoo speek sloh-lee', 'Can you speak slowly?', [['Can you', 'request'], ['speak', 'talk'], ['slowly', 'not fast']])],
  travel: [phrase('Is it far from here?', 'iz it far from heer', 'Is it far from here?', [['Is it', 'question'], ['far', 'long distance'], ['from here', 'this place']]), phrase('Can you show me the way?', 'kan yoo show mee thuh way', 'Can you show me the way?', [['Can you', 'request'], ['show me', 'help me see'], ['the way', 'road']]), phrase('I am looking for my hotel.', 'ai am look-ing for my hoh-tel', 'I am looking for my hotel.', [['I am looking for', 'I search'], ['my hotel', 'place to sleep']])],
};
function phrase(text: string, sound: string, translation: string, words: Array<[string, string]>): Phrase {
  return { text, sound, translation, words: words.map(([word, meaning]) => ({ word, meaning })) };
}
function simpleLesson(hello: string, helloSound: string, cafe: string, cafeSound: string, school: string, schoolSound: string, travel: string, travelSound: string): PhraseSet {
  return {
    greetings: [phrase(hello, helloSound, 'Привет, меня зовут Алекс.', [['hello', 'привет'], ['name', 'имя'], ['Alex', 'Алекс']])],
    cafe: [phrase(cafe, cafeSound, 'Я хочу воды, пожалуйста.', [['I want', 'я хочу'], ['water', 'вода'], ['please', 'пожалуйста']])],
    school: [phrase(school, schoolSound, 'Можешь помочь мне?', [['can you', 'можешь'], ['help', 'помочь'], ['me', 'мне']])],
    travel: [phrase(travel, travelSound, 'Где станция?', [['where', 'где'], ['station', 'станция']])],
  };
}
function getLesson(language: string, situation: SituationId) {
  const languageLessons = phraseBank[language] ?? phraseBank.English;
  const phrases = languageLessons[situation];
  return { ...lessonTitles[situation], phrases: [...phrases, ...extraPracticePhrases[situation]] };
}
export default function AITutor({ languages, onTrainingComplete }: Props) {
  const tutorLanguages = languages.filter((item) => item !== 'All');
  const [language, setLanguage] = useState(tutorLanguages[0] || 'English');
  const [situation, setSituation] = useState<SituationId>('greetings');
  const [completed, setCompleted] = useState<string[]>([]);
  const lesson = useMemo(() => getLesson(language, situation), [language, situation]);

  function toggleComplete(text: string) {
    setCompleted((items) => (items.includes(text) ? items.filter((item) => item !== text) : [...items, text]));
  }

  return (
    <section className="ai-tutor" aria-label="Speaking trainer">
      <div className="ai-tutor-header">
        <strong><Mic aria-hidden="true" size={18} /> Speaking Trainer</strong>
        <p>Learn by a video-call style trainer, then review pronunciation, translation, and every word.</p>
      </div>

      <div className="ai-tutor-controls">
        <label>Language
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {tutorLanguages.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Situation
          <select value={situation} onChange={(event) => setSituation(event.target.value as SituationId)}>
            {situations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="speaking-goal">
        <BookOpen aria-hidden="true" size={18} />
        <span><strong>{lesson.title}</strong>{lesson.goal}</span>
      </div>

      <VideoCallTrainer
        language={language}
        phrases={lesson.phrases}
        onPassed={(text) => setCompleted((items) => (items.includes(text) ? items : [...items, text]))}
        onComplete={onTrainingComplete}
      />

      <div className="phrase-list">
        {lesson.phrases.map((item) => (
          <article className="phrase-card" key={item.text}>
            <div>
              <strong>{item.text}</strong>
              <p>{item.sound}</p>
              <small>{item.translation}</small>
            </div>
            <ul>
              {item.words.map((part) => <li key={`${item.text}-${part.word}`}><span>{part.word}</span><strong>{part.meaning}</strong></li>)}
            </ul>
            <SpeechPractice language={language} target={item.text} onPassed={() => setCompleted((items) => (items.includes(item.text) ? items : [...items, item.text]))} />
            <button type="button" onClick={() => toggleComplete(item.text)}>
              <span className="button-label">
                {completed.includes(item.text) ? <Check aria-hidden="true" size={18} /> : <MessageCircle aria-hidden="true" size={18} />}
                <span>{completed.includes(item.text) ? 'I can say it' : 'Practice aloud'}</span>
              </span>
            </button>
          </article>
        ))}
      </div>

      <div className="roleplay-box">
        <strong>Roleplay</strong>
        <p>Say the first phrase aloud, then answer: "And you?" Repeat until it feels easy.</p>
        <button className="secondary" type="button" onClick={() => setCompleted([])}>
          <span className="button-label"><RotateCcw aria-hidden="true" size={18} /><span>Reset practice</span></span>
        </button>
      </div>
    </section>
  );
}
