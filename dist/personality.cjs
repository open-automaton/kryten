"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PersonalityComponent = exports.Personality = void 0;
var _random = require("@environment-safe/random");
class PersonalityComponent {
  constructor(options = {}) {
    this.options = options;
  }
  persona(seed, person) {
    const random = new _random.Random({
      seed
    });
    if (this.options.seed) {
      this.options.seed(random, person);
      return {};
    }
    return {};
  }
  build(analyzedState, persona) {
    if (this.options.text) return this.options.text;
    if (this.options.state) return this.options.state(analyzedState, persona);
  }
}
exports.PersonalityComponent = PersonalityComponent;
class Personality {
  constructor(options = {}) {
    this.options = options;
    this.plans = [];
    this.seed = this.options.seed || 'default-seed';
    //if(options.plans) options.plans.forEach((plan)=> this.planner(plan));
    if (this.options.components) {
      this.persona = this.person();
    }
  }
  person() {
    //object(name, text)
    //TODO: make plans experimental(with some always experimental)
    const persona = {};
    const components = this.options.components || [];
    let attributes = null;
    let attributeKeys = null;
    for (let lcv = 0; lcv < components.length; lcv++) {
      attributes = components[lcv].persona(this.seed, persona);
      attributeKeys = Object.keys(attributes);
      for (let attributeIndex = 0; attributeIndex < attributeKeys.length; attributeIndex++) {
        persona[attributeKeys[attributeIndex]] = attributes[attributeKeys[attributeIndex]];
      }
    }
    return persona;
  }
  build(context = {}) {
    const components = this.options.components || [];
    const results = [];
    let state = null;
    for (let lcv = 0; lcv < components.length; lcv++) {
      state = {
        seed: this.seed,
        persona: this.person(),
        ...context
      };
      results.push(components[lcv].build(state));
    }
    return results.join('\n\n');
  }
}
exports.Personality = Personality;
const formatLine = (name, value) => {
  switch (typeof value) {
    case 'string':
      return `${name} is \`${value}\`\n`;
    case 'number':
      return `There are ${value} ${name}\n`;
    default:
      return '';
  }
};
const index = [new PersonalityComponent({
  name: 'state',
  state: state => {
    let result = '';
    console.log('ST', state);
    state.words = state.query.split(' ').length;
    state.sentences = state.query.split('.').length;
    let keys = Object.keys(state);
    for (let lcv = 0; lcv < keys.length; lcv++) {
      if (typeof state[keys[lcv]] !== 'object') {
        result += formatLine(keys[lcv], state[keys[lcv]]);
      }
    }
    if (state.persona) {
      keys = Object.keys(state.persona);
      for (let lcv = 0; lcv < keys.length; lcv++) {
        if (typeof state.persona[keys[lcv]] !== 'object') {
          result += formatLine(keys[lcv], state.persona[keys[lcv]]);
        }
      }
    }
    const min = Math.floor(state.words * 0.5);
    const max = Math.floor(state.words * 2.5);
    const chatText = state.chat.map(item => {
      return `${item.user}: ${item.message}`;
    }).join('\n');
    return `The current state of the world
------------
${result}

Chat Log
--------
${chatText}

Given this conversation, answer the following query in roughly ${min}-${max} words with no lists, no emojis, no stage directions, no emotes and avoid quotes: `;
  }
}), new PersonalityComponent({
  name: 'ocean',
  seed: (random, persona) => {
    const OCEAN = {
      open: random.ratio(),
      conscientious: random.ratio(),
      extroverted: random.ratio(),
      agreeable: random.ratio(),
      neurotic: random.ratio()
    };
    persona.ocean = OCEAN;
  },
  state: ({
    seed,
    query,
    persona
  }) => {
    let oceanScore = '';
    const keys = Object.keys(persona.ocean);
    for (let lcv = 0; lcv < keys.length; lcv++) {
      oceanScore += `${keys[lcv]}: \`${persona.ocean[keys[lcv]]}\`\n`;
    }
    const ocean = `
OCEAN Scale
-----------
- **Openness** : Openness is when someone is curious and open-minded to new experiences and knowledge. People who rate high in openness are inventive and curious. People who rate low in openness are consistent and cautious.
- **Conscientiousness** : Conscientiousness is the trait that describes how organized and dependable you are. People high in this trait have high self-discipline, are very organized and prepared, and like to plan things out instead of being spontaneous. People who have this trait tend to live longer.
- **Extroversion** : Extroversion describes how you interact with people. People who are high in extroversion (extroverts) are outgoing and energetic, while people who are low in extroversion (introverts) are more solitary and reserved and typically require recharge time from social interaction. As it turns out, people who are more outgoing and sociable have the strongest immune system compared to those who are more introspective and introverted. Extroversion is corrolated with a strong immune system.
- **Agreeableness** : Agreeableness is how you feel towards others. Agreeableness is how you feel toward others. People who rate high in agreeableness are friendly and compassionate. People who rate low in agreeableness are more analytical and detached. Agreeability is corrolated to cardiovascular health.
- **Neuroticism** : Neuroticism is how you deal with emotions. People who rate high in neuroticism are sensitive and tend to be more nervous. People who rate low in neuroticism tend to be more secure and stable.

Your OCEAN scores (on a scale from 0.0 to 1.0) are:
${oceanScore}`;
    return ocean;
  }
}), new PersonalityComponent({
  name: 'agent',
  text: 'You are an AI agent, tasked with understanding and executing a fixed set of tasks in order to help users percieve their world and perform tasks. You are to assume a role as a character and answer queries based on that role rather than answering from the perspective of an AI. Do not reveal you are an AI or break character in any way.'
})];
PersonalityComponent.choose = nameList => {
  const results = index.filter(item => nameList.indexOf(item.options.name) !== -1);
  return results;
};