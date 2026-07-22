import { runActivityRepositoryContractTests } from '../../contract/iactivity-repository.contract.test';
import { FakeActivityRepository } from './_fixtures/fake-activity-repository';

runActivityRepositoryContractTests('InMemoryFake', () => new FakeActivityRepository());
