import {
  IUnitRepository,
  IUnit,
  IUnitSummary,
  CreateUnitInput,
  UpdateUnitInput,
  UnitFilter,
} from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { UnitRepository } from '../../repositories/units/unit.repository';

export class UnitService {
  constructor(private readonly unitRepository: IUnitRepository = new UnitRepository()) {}

  async createUnit(input: CreateUnitInput): Promise<RepositoryResult<IUnit>> {
    return this.unitRepository.createUnit(input);
  }

  async updateUnit(id: string, input: UpdateUnitInput, expectedVersion: number): Promise<RepositoryResult<IUnit>> {
    return this.unitRepository.updateUnit(id, input, expectedVersion);
  }

  async getUnitById(id: string): Promise<RepositoryResult<IUnit>> {
    return this.unitRepository.getUnitById(id);
  }

  async listUnits(filter: UnitFilter, page: PageQuery): Promise<RepositoryResult<Page<IUnitSummary>>> {
    return this.unitRepository.listUnits(filter, page);
  }

  async getUnitsByTerm(academicTermId: string): Promise<RepositoryResult<IUnit[]>> {
    return this.unitRepository.getUnitsByTerm(academicTermId);
  }

  async softDeleteUnit(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return this.unitRepository.softDeleteUnit(id, requestId);
  }

  async restoreUnit(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return this.unitRepository.restoreUnit(id, requestId);
  }

  getRepository(): IUnitRepository {
    return this.unitRepository;
  }
}
