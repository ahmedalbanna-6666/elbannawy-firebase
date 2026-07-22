import { EducationalSystem } from './educational-system.entity';
import { Stage } from './stage.entity';
import { Grade } from './grade.entity';
import { AcademicYear } from './academic-year.entity';
import { AcademicTerm } from './academic-term.entity';

export interface CurrentAcademicContext {
  readonly educationalSystem: EducationalSystem | null;
  readonly stage: Stage | null;
  readonly grade: Grade | null;
  readonly academicYear: AcademicYear | null;
  readonly academicTerm: AcademicTerm | null;
}
