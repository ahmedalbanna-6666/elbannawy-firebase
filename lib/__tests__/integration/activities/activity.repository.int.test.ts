import { runActivityRepositoryContractTests } from '../../contract/iactivity-repository.contract.test';

// Skip integration tests by default unless FIRESTORE_EMULATOR_HOST is set
const runIntegration = !!process.env.FIRESTORE_EMULATOR_HOST;

(runIntegration ? describe : describe.skip)('ActivityRepository Integration', () => {
  runActivityRepositoryContractTests('Firestore', () => {
    // Dynamic import to avoid module resolution issues when emulator is not running
    const { ActivityRepository } = require('../../../repositories/activities/activity.repository');
    return new ActivityRepository();
  });
});
