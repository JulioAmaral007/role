// Coloca o teste que apaga o usuário B por último: os outros arquivos ainda usam o B.
const Sequencer = require('@jest/test-sequencer').default;

const RUNS_LAST = 'deleteMyData.test.ts';

class DbTestSequencer extends Sequencer {
  sort(tests) {
    const sorted = super.sort(tests);
    return [
      ...sorted.filter((test) => !test.path.endsWith(RUNS_LAST)),
      ...sorted.filter((test) => test.path.endsWith(RUNS_LAST)),
    ];
  }
}

module.exports = DbTestSequencer;
