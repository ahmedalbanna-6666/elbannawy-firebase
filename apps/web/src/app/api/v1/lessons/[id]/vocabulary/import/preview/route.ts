import { NextResponse, type NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VocabularyImportService } from '@el-bannawy/lib';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const lessonId = (await params).id;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'No file provided' } }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.docx';
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, 'vocab-import-' + lessonId + '-' + String(Date.now()) + ext);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    try {
      const service = new VocabularyImportService();
      const result = await service.previewAsResult(tempPath);
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: result.value, parserProfile: result.value.parserProfile ?? 'VOCABULARY_STRUCTURED_V2' });
    } finally {
      try { fs.unlinkSync(tempPath); } catch { /* ignore cleanup errors */ }
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Preview failed' } }, { status: 500 });
  }
}
