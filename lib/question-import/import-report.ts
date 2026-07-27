import type { ValidationReport, ValidationIssue, ImportedActivity } from './types';

export interface ImportSummary {
  documentTitle: string;
  totalActivities: number;
  totalQuestions: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  recoveredSections: number;
  unknownMarkers: number;
  duplicateQuestions: number;
  duplicateAnswers: number;
  duplicateWordBankEntries: number;
  missingAnswers: number;
  brokenSections: number;
  importSafetyScore: number;
  validationScore: number;
}

export interface FormattedReport {
  summary: ImportSummary;
  issuesBySeverity: { critical: ValidationIssue[]; error: ValidationIssue[]; warning: ValidationIssue[]; info: ValidationIssue[] };
  activitiesSummary: { type: string; order: number; questionCount: number; errorCount: number; warningCount: number }[];
}

function countQuestions(activity: ImportedActivity): number {
  const c = activity.content;
  if ('categories' in c) return c.categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  if ('questions' in c) return c.questions.length;
  if ('parts' in c) return c.parts.reduce((sum, p) => sum + p.questions.length, 0);
  if ('lines' in c) return Object.keys(c.answers).length;
  if ('topic' in c) return 1;
  if ('wordBank' in c) return Object.keys(c.answers).length;
  return 0;
}

export function generateImportReport(
  documentTitle: string,
  activities: ImportedActivity[],
  report: ValidationReport,
): FormattedReport {
  const issuesBySeverity = {
    critical: report.issues.filter((i) => i.severity === 'CRITICAL'),
    error: report.issues.filter((i) => i.severity === 'ERROR'),
    warning: report.issues.filter((i) => i.severity === 'WARNING'),
    info: report.issues.filter((i) => i.severity === 'INFO'),
  };

  const recoveredSections = report.recoveryActions.filter((a) => a.success).length;
  const unknownMarkers = report.unknownMarkers.length;
  const duplicateQuestions = report.answerKeys?.duplicateAnswers.length ?? 0;
  const duplicateAnswers = report.answerKeys?.duplicateAnswers.length ?? 0;
  const duplicateWordBankEntries = report.wordBank?.duplicateWords.length ?? 0;
  const missingAnswers = (report.answerKeys?.missingAnswers.length ?? 0)
    + (report.reading?.missingAnswers.length ?? 0)
    + (report.dialogue?.missingAnswers.length ?? 0);
  const brokenSections = report.document.emptySections.length
    + report.document.brokenMarkers.length;

  const activitiesSummary = activities.map((a) => ({
    type: a.type,
    order: a.order,
    questionCount: countQuestions(a),
    errorCount: a.errors.length + report.issues.filter((i) => i.activityType === a.type && i.severity === 'ERROR').length,
    warningCount: a.warnings.length + report.issues.filter((i) => i.activityType === a.type && i.severity === 'WARNING').length,
  }));

  const summary: ImportSummary = {
    documentTitle,
    totalActivities: activities.length,
    totalQuestions: activities.reduce((sum, a) => sum + countQuestions(a), 0),
    totalIssues: report.issues.length,
    errors: issuesBySeverity.error.length + issuesBySeverity.critical.length,
    warnings: issuesBySeverity.warning.length,
    infos: issuesBySeverity.info.length,
    recoveredSections,
    unknownMarkers,
    duplicateQuestions,
    duplicateAnswers,
    duplicateWordBankEntries,
    missingAnswers,
    brokenSections,
    importSafetyScore: report.importSafetyScore,
    validationScore: report.validationScore,
  };

  return { summary, issuesBySeverity, activitiesSummary };
}
