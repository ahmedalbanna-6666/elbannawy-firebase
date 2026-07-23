import { TeacherRepository } from '../../repositories/teacher/teacher.repository';
import { CurriculumRepository } from '../../repositories/curriculum/curriculum.repository';
import type {
  ITutorRepository,
} from '../../repositories/contracts';
import type { RepositoryResult } from '../../shared/types/repository.types';

export interface TeacherGradeInfo {
  id: string;
  name: string;
  stage: { id: string; name: string };
}

export interface MyGradesResult {
  gradeIds: string[];
  grades: TeacherGradeInfo[];
}

export class TeacherService {
  constructor(
    private readonly teacherRepo: ITutorRepository = new TeacherRepository(),
    private readonly curriculumRepo = new CurriculumRepository(),
  ) {}

  async getMyGrades(teacherId: string): Promise<RepositoryResult<MyGradesResult>> {
    const assignmentsResult = await this.teacherRepo.listTeacherAssignments(teacherId, { limit: 100 });
    if (!assignmentsResult.ok) return assignmentsResult as unknown as RepositoryResult<MyGradesResult>;

    const assignments = assignmentsResult.value.items;
    if (assignments.length === 0) {
      return { ok: true, value: { gradeIds: [], grades: [] } };
    }

    const gradeIds = assignments.map((a) => a.gradeId);
    const grades: TeacherGradeInfo[] = [];

    for (const gradeId of gradeIds) {
      const gradeResult = await this.curriculumRepo.getGradeById(gradeId);
      if (!gradeResult.ok) continue;

      const grade = gradeResult.value;
      let stageName = '';
      if (grade.stageId) {
        const stageResult = await this.curriculumRepo.getStageById(grade.stageId);
        if (stageResult.ok) {
          stageName = stageResult.value.nameAr || stageResult.value.name;
        }
      }

      grades.push({
        id: grade.id,
        name: grade.nameAr || grade.name,
        stage: { id: grade.stageId, name: stageName || grade.stageId },
      });
    }

    return {
      ok: true,
      value: { gradeIds, grades },
    };
  }
}
