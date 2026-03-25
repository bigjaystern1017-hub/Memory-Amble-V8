import {
  createFreshState,
  getTimbukMessage,
  getNextBeat,
  type BeatId,
  type ConversationState,
} from './client/src/components/beat-engine';
import { getLessonConfig } from './client/src/lib/progress';

function runFlow(label: string, initialState: ConversationState, startBeat: BeatId) {
  console.log('\n' + '='.repeat(60));
  console.log(`SCENARIO: ${label}`);
  console.log('='.repeat(60));
  
  let state = { ...initialState };
  let beat: BeatId | null = startBeat;
  let stepCount = 0;
  const maxSteps = 50;

  while (beat && stepCount < maxSteps) {
    const msg = getTimbukMessage(beat, state);
    if (msg && msg !== '__SMART_CONFIRM__') {
      console.log(`\n[${beat}]`);
      console.log(msg.substring(0, 200));
    }

    // Simulate user input for beats that need it
    if (beat === 'ask-stop') {
      const mockStops = ['Front door', 'Kitchen', 'Living room', 'Bedroom', 'Bathroom'];
      const stop = mockStops[state.stepIndex] || 'Hallway';
      state = { ...state, stops: [...state.stops, stop] };
    }

    if (beat === 'place-object') {
      const newScenes = [...state.userScenes];
      newScenes[state.stepIndex] = 'a vivid silly image';
      state = { ...state, userScenes: newScenes };
    }

    if (beat === 'recall') {
      const newAnswers = [...state.userAnswers];
      newAnswers[state.stepIndex] = state.assignments[state.stepIndex]?.object || '';
      state = { 
        ...state, 
        userAnswers: newAnswers, 
        correctCount: state.correctCount + 1 
      };
    }

    if (beat === 'practice-item') {
      state = { ...state, practiceScene: 'its on fire' };
    }

    if (beat === 'practice-recall') {
      state = { ...state, practiceRecallAnswer: 'pineapple' };
    }

    if (beat === 'onboard-skill') {
      state = { ...state, placeName: 'Your house', stops: [] };
    }

    if (beat === 'expansion-offer') {
      // Simulate accepting expansion
      state = { ...state, expansionOffered: true, expansionAccepted: true, itemCount: state.itemCount + 2 };
    }

    if (beat === 'expansion-stop-1') {
      const newStop = 'Hallway';
      state = { ...state, stops: [...state.stops, newStop] };
    }

    if (beat === 'expansion-stop-2') {
      const newStop = 'Office';
      state = { ...state, stops: [...state.stops, newStop] };
    }

    if (beat === 'expansion-preview') {
      // Simulate new assignments for expansion items
      state = { 
        ...state, 
        assignments: [
          ...state.assignments,
          { stopName: 'Hallway', object: 'accordion' },
          { stopName: 'Office', object: 'cactus' }
        ],
        stepIndex: state.itemCount - 2
      };
    }

    const next = getNextBeat(beat, state);

    // Handle step increments
    if (
      (beat === 'react-stop' && next === 'ask-stop') ||
      (beat === 'mirror-object' && next === 'place-object') ||
      (beat === 'react-recall' && next === 'recall') ||
      (beat === 'react-check-in' && next === 'check-in-recall')
    ) {
      state = { ...state, stepIndex: state.stepIndex + 1 };
    }

    if (beat === 'react-stop' && next === 'assigning') {
      // Simulate assignment
      state = { 
        ...state, 
        stepIndex: 0,
        assignments: state.stops.map((s, i) => ({ 
          stopName: s, 
          object: ['penguin', 'typewriter', 'crown', 'accordion', 'cactus'][i] || 'trophy'
        }))
      };
    }

    if (beat === 'mirror-object' && next === 'palace-buffer') {
      state = { ...state, stepIndex: 0 };
    }

    beat = next;
    stepCount++;
  }
}

// DAY 1 SCENARIO
const day1State = createFreshState();
day1State.userName = 'Gladys';
day1State.dayCount = 0;
day1State.itemCount = 3;
day1State.lessonConfig = getLessonConfig(3, 0, 'objects');
runFlow('DAY 1 - Fresh User', day1State, 'onboard-welcome');

// DAY 2 SCENARIO  
const day2State = createFreshState();
day2State.userName = 'Gladys';
day2State.dayCount = 1;
day2State.itemCount = 3;
day2State.isReturningUser = true;
day2State.placeName = 'Your house';
day2State.stops = ['Front door', 'Kitchen', 'Living room'];
day2State.lessonConfig = getLessonConfig(3, 1, 'objects');
day2State.checkInAssignments = [
  { stopName: 'Front door', object: 'penguin' },
  { stopName: 'Kitchen', object: 'typewriter' },
  { stopName: 'Living room', object: 'crown' },
];
day2State.checkInPlace = 'Your house';
day2State.yesterdayScore = 3;
day2State.yesterdayTotal = 3;
day2State.assignments = [
  { stopName: 'Front door', object: 'accordion' },
  { stopName: 'Kitchen', object: 'cactus' },
  { stopName: 'Living room', object: 'trophy' },
];
runFlow('DAY 2 - Returning User', day2State, 'check-in-intro');

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE');
console.log('='.repeat(60));
