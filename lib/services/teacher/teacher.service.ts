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

    const gradeResults = await Promise.all(
      gradeIds.map((gid) => this.curriculumRepo.getGradeById(gid)),
    );

    const stageIds = [
      ...new Set(
        gradeResults
          .filter((r): r is { ok: true; value: { stageId: string } } & typeof r => r.ok && !!r.value.stageId)
          .map((r) => r.value.stageId),
      ),
    ];

    const stageResults = await Promise.all(
      stageIds.map((sid) => this.curriculumRepo.getStageById(sid)),
    );

    const stageNameById = new Map<string, string>();
    for (const sr of stageResults) {
      if (!sr.ok) continue;
      const stage = sr.value;
      stageNameById.set(stage.id, stage.nameAr || stage.name);
    }

    const grades: TeacherGradeInfo[] = [];
    for (const gr of gradeResults) {
      if (!gr.ok) continue;
      const grade = gr.value;
      grades.push({
        id: grade.id,
        name: grade.nameAr || grade.name,
        stage: {
          id: grade.stageId,
          name: grade.stageId ? stageNameById.get(grade.stageId) || grade.stageId : '',
        },
      });
    }

    return {
      ok: true,
      value: { gradeIds, grades },
    };
  }
}
