import { NextResponse } from 'next/server';
import { PERMISSIONS, getPermissionsForRole } from '@el-bannawy/shared';

const PERMISSION_LABELS: Record<string, string> = {
  'users.view': 'عرض المستخدمين',
  'users.create': 'إنشاء مستخدم',
  'users.edit': 'تعديل المستخدم',
  'users.delete': 'حذف المستخدم',
  'units.view': 'عرض الوحدات',
  'units.create': 'إنشاء وحدة',
  'units.edit': 'تعديل الوحدة',
  'units.delete': 'حذف الوحدة',
  'lessons.view': 'عرض الدروس',
  'lessons.create': 'إنشاء درس',
  'lessons.edit': 'تعديل الدرس',
  'lessons.delete': 'حذف الدرس',
  'videos.upload': 'رفع فيديو',
  'pdfs.upload': 'رفع PDF',
  'vocabulary.manage': 'إدارة المفردات',
  'homework.manage': 'إدارة الواجبات',
  'quizzes.manage': 'إدارة الاختبارات',
  'story.view': 'عرض القصة',
  'story.edit': 'تعديل القصة',
  'story.publish': 'نشر القصة',
  'final_review.view': 'عرض المراجعة النهائية',
  'final_review.edit': 'تعديل المراجعة النهائية',
  'live.view': 'عرض الحصص المباشرة',
  'live.create': 'إنشاء حصة مباشرة',
  'live.edit': 'تعديل الحصة المباشرة',
  'live.delete': 'حذف الحصة المباشرة',
  'live.control': 'التحكم بالحصص المباشرة',
  'students.view': 'عرض الطلاب',
  'students.create': 'إنشاء طالب',
  'ai.manage': 'إدارة الذكاء الاصطناعي',
  'reports.view': 'عرض التقارير',
  'reports.export': 'تصدير التقارير',
  'notifications.send': 'إرسال إشعارات',
  'settings.manage': 'إدارة الإعدادات',
  'support.answer': 'الرد على تذاكر الدعم',
  'learning.access': 'الوصول إلى المحتوى التعليمي',
  'mistakes.view': 'عرض الأخطاء',
  'mistakes.practice': 'التدريب على الأخطاء',
  'roles.manage': 'إدارة الأدوار والصلاحيات',
  'platform.manage': 'إدارة المنصة',
  'coins.view': 'عرض العملات',
  'coins.manage': 'إدارة باقات العملات',
  'coins.grant': 'منح العملات',
  'coins.purchase': 'شراء العملات',
  'coins.unlock': 'فتح المحتوى بالعملات',
  'unlock_codes.manage': 'إدارة رموز التفعيل',
  'unlock_requests.manage': 'إدارة طلبات فتح المحتوى',
  'competition.manage': 'إدارة المسابقات',
  'competition.view': 'عرض المسابقات',
};

const ROLES = [
  { role: 'ADMINISTRATOR', label: 'مدير النظام', description: 'صلاحية كاملة على جميع أجزاء المنصة' },
  { role: 'TEACHER', label: 'معلم', description: 'إدارة المحتوى التعليمي والطلاب والتقارير' },
  { role: 'STAFF', label: 'موظف', description: 'صلاحية محدودة للدعم الفني ورفع الملفات' },
  { role: 'STUDENT', label: 'طالب', description: 'الوصول إلى المحتوى التعليمي والألعاب' },
];

export async function GET(): Promise<NextResponse> {
  try {
    const allPermissions = Object.entries(PERMISSIONS).map(([key, value]) => ({
      key,
      permission: value,
      label: PERMISSION_LABELS[value] ?? value,
    }));

    const rolesWithPermissions = ROLES.map((roleDef) => ({
      ...roleDef,
      permissions: getPermissionsForRole(roleDef.role as never).map((p: string) => ({
        permission: p,
        label: PERMISSION_LABELS[p] ?? p,
      })),
    }));

    return NextResponse.json({ success: true, data: { roles: rolesWithPermissions, allPermissions } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to load roles' } }, { status: 500 });
  }
}
