"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentBlock } from "@/components/units/content-block";
import { UploadCard } from "@/components/units/upload-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { usePermissions } from "@/lib/use-permissions";
import { Switch } from "@/components/ui/switch";
import {
  MonitorPlay, Languages, FileText, GraduationCap, ClipboardList,
  Plus, Trash2, Film, Pencil, Eye,
  type LucideIcon,
} from "lucide-react";

export interface ContentConfig {
  entityType: string;
  entityId: string;
  labels: {
    entityName: string;
    video: string;
    vocabulary: string;
    pdf: string;
    quiz: string;
    homework: string;
  };
}

interface ContentVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  providerName: string;
  providerVideoId: string;
  displayOrder: number;
}

interface ContentVocabularyItem {
  id: string;
  word: string;
  translation: string;
  definition: string | null;
  example: string | null;
  partOfSpeech: string | null;
  displayOrder: number;
}

interface ContentDocument {
  id: string;
  fileName: string;
  fileUrl?: string;
  storagePath?: string;
  mimeType?: string;
  fileSize: number;
  downloadable: boolean;
}

interface ContentQuiz {
  id: string;
  title: string;
  questionCount?: number;
}

interface ContentHomework {
  id: string;
  title: string;
  questionCount?: number;
}

const API_BASE = "/api/v1/content";

function getApiPath(entityType: string, entityId: string, type: string): string {
  return `${API_BASE}/${type}/${entityType.toUpperCase()}/${entityId}`;
}

function VideoBlock({ config }: { config: ContentConfig }): ReactNode {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const path = getApiPath(config.entityType, config.entityId, "videos");

  const { data: videos = [] } = useQuery({
    queryKey: [path],
    queryFn: async () => { const res = await api.get<ContentVideo[]>(path); return res.data ?? []; },
  });

  const addMutation = useMutation({
    mutationFn: async () => api.post(path, { youtubeUrl: url.trim() }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); setUrl(""); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`${path}/${id}`),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); },
  });

  return (
    <div className="flex flex-col gap-3">
      {videos.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-400">لا يوجد فيديو</p>
      ) : videos.map((video) => (
        <div key={video.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
          <Film className="h-5 w-5 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{video.title}</p>
            <p className="truncate text-xs text-neutral-400">{video.providerName} • {video.providerVideoId}</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="حذف" className="text-danger-500 hover:bg-danger-500/10"
            loading={deleteMutation.isPending} onClick={(): void => { deleteMutation.mutate(video.id); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <Input placeholder="https://www.youtube.com/watch?v=..." value={url}
          onChange={(e): void => { setUrl(e.target.value); }} className="flex-1" />
        <Button variant="primary" size="sm" loading={addMutation.isPending} disabled={!url.trim()}
          onClick={(): void => { addMutation.mutate(); }}>
          <Plus className="h-4 w-4" /> إضافة
        </Button>
      </div>
      {addMutation.isError && (
        <p className="text-sm text-danger-500" role="alert">
          {addMutation.error instanceof Error ? addMutation.error.message : "فشل إضافة الفيديو"}
        </p>
      )}
    </div>
  );
}

function VocabularyBlock({ config }: { config: ContentConfig }): ReactNode {
  const queryClient = useQueryClient();
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editTranslation, setEditTranslation] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; word: string } | null>(null);
  const path = getApiPath(config.entityType, config.entityId, "vocabulary");

  const { data: items = [] } = useQuery({
    queryKey: [path],
    queryFn: async () => { const res = await api.get<ContentVocabularyItem[]>(path); return res.data ?? []; },
  });

  const addMutation = useMutation({
    mutationFn: async () => api.post(path, { word: word.trim(), translation: translation.trim() }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); setWord(""); setTranslation(""); },
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.patch(`${path}/${editingId}`, { word: editWord.trim(), translation: editTranslation.trim() }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`${path}/${id}`),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); setDeleteTarget(null); },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => api.delete(path),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-700">
        <Input placeholder="الكلمة" value={word} onChange={(e): void => { setWord(e.target.value); }} className="flex-1" />
        <Input placeholder="الترجمة" value={translation} onChange={(e): void => { setTranslation(e.target.value); }} className="flex-1" />
        <Button variant="primary" size="sm" loading={addMutation.isPending}
          disabled={!word.trim() || !translation.trim()}
          onClick={(): void => { addMutation.mutate(); }}>
          <Plus className="h-4 w-4" /> إضافة
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="لا توجد مفردات" description="أضف المفردات باستخدام الحقل أعلاه" icon={<Languages className="h-8 w-8" />} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">الكلمة</TableHead>
                <TableHead className="w-1/4">الترجمة</TableHead>
                <TableHead className="w-1/4">التعريف</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {editingId === item.id ? (
                    <>
                      <TableCell><Input value={editWord} onChange={(e) => setEditWord(e.target.value)} /></TableCell>
                      <TableCell><Input value={editTranslation} onChange={(e) => setEditTranslation(e.target.value)} /></TableCell>
                      <TableCell></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => updateMutation.mutate()}><Check className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{item.word}</TableCell>
                      <TableCell className="text-neutral-500">{item.translation}</TableCell>
                      <TableCell className="text-xs text-neutral-400">{item.definition ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => { setEditingId(item.id); setEditWord(item.word); setEditTranslation(item.translation); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-danger-500" onClick={() => setDeleteTarget({ id: item.id, word: item.word })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-danger-500" loading={deleteAllMutation.isPending}
            onClick={() => { if (confirm(`حذف كل المفردات (${items.length})؟`)) deleteAllMutation.mutate(); }}>
            <Trash2 className="h-4 w-4" /> حذف الكل
          </Button>
        </div>
      )}

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="تأكيد الحذف">
        <DialogContent>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            هل أنت متأكد من حذف كلمة "{deleteTarget?.word ?? ""}"؟
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          <Button variant="danger" loading={deleteMutation.isPending}
            onClick={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}>حذف</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function PdfBlock({ config }: { config: ContentConfig }): ReactNode {
  const queryClient = useQueryClient();
  const path = getApiPath(config.entityType, config.entityId, "documents");

  const { data: doc } = useQuery({
    queryKey: [path],
    queryFn: async () => { const res = await api.get<ContentDocument | null>(path); return res.data ?? null; },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE}/documents/${config.entityType.toUpperCase()}/${config.entityId}`, {
        method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData,
      });
      if (!response.ok) throw new Error("فشل رفع الملف");
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(path),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); },
  });

  const toggleDownloadMutation = useMutation({
    mutationFn: async (downloadable: boolean) => api.patch(path, { downloadable }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); },
  });

  const { isTeacher, isAdmin } = usePermissions();
  const isStaff = isTeacher || isAdmin;

  return (
    <UploadCard
      title={config.labels.pdf} description={`رفع واستبدال وحذف ملف PDF`} icon={FileText}
      accept=".pdf" state={doc ? "uploaded" : "empty"}
      fileInfo={doc ? { name: doc.fileName, size: doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "—" } : null}
      onFileSelect={(file) => uploadMutation.mutate(file)}
      onDelete={() => deleteMutation.mutate()}
      footer={doc ? (
        <div className="flex items-center justify-between gap-3">
          {doc.storagePath && (
            <a href={doc.storagePath} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:underline">
              <Eye className="h-4 w-4" /> معاينة الملف
            </a>
          )}
          {isStaff && (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Switch checked={doc.downloadable} onChange={(e) => toggleDownloadMutation.mutate(e.target.checked)}
                aria-label="السماح للطالب بتحميل الملف" />
              السماح للطالب بالتحميل
            </label>
          )}
        </div>
      ) : undefined}
    />
  );
}

function QuizBlock({ config }: { config: ContentConfig }): ReactNode {
  const queryClient = useQueryClient();
  const path = getApiPath(config.entityType, config.entityId, "quiz");

  const { data: quiz } = useQuery({
    queryKey: [path], queryFn: async () => { const res = await api.get<ContentQuiz | null>(path); return res.data ?? null; },
  });

  const [title, setTitle] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => api.post(path, { title: title.trim(), questionCount: 0 }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); setTitle(""); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(path),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); },
  });

  return (
    <UploadCard
      title={config.labels.quiz} description="إنشاء وحذف الاختبار" icon={GraduationCap}
      accept=".docx,.doc" state={quiz ? "uploaded" : "empty"}
      fileInfo={quiz ? { name: quiz.title, size: quiz.questionCount ? `${quiz.questionCount} سؤال` : "—" } : null}
      onFileSelect={() => {}}
      onDelete={() => deleteMutation.mutate()}
      footer={!quiz ? (
        <div className="flex items-center gap-2 pt-2">
          <Input placeholder="عنوان الاختبار" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
          <Button size="sm" loading={createMutation.isPending} disabled={!title.trim()}
            onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4" /> إنشاء
          </Button>
        </div>
      ) : undefined}
    />
  );
}

function HomeworkBlock({ config }: { config: ContentConfig }): ReactNode {
  const queryClient = useQueryClient();
  const path = getApiPath(config.entityType, config.entityId, "homework");

  const { data: hw } = useQuery({
    queryKey: [path], queryFn: async () => { const res = await api.get<ContentHomework | null>(path); return res.data ?? null; },
  });

  const [title, setTitle] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => api.post(path, { title: title.trim(), questionCount: 0 }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); setTitle(""); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(path),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: [path] }); },
  });

  return (
    <UploadCard
      title={config.labels.homework} description="إنشاء وحذف الواجب" icon={ClipboardList}
      accept=".docx,.doc" state={hw ? "uploaded" : "empty"}
      fileInfo={hw ? { name: hw.title, size: hw.questionCount ? `${hw.questionCount} سؤال` : "—" } : null}
      onFileSelect={() => {}}
      onDelete={() => deleteMutation.mutate()}
      footer={!hw ? (
        <div className="flex items-center gap-2 pt-2">
          <Input placeholder="عنوان الواجب" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
          <Button size="sm" loading={createMutation.isPending} disabled={!title.trim()}
            onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4" /> إنشاء
          </Button>
        </div>
      ) : undefined}
    />
  );
}

export function EntityContentBlocks({ config }: { config: ContentConfig }): ReactNode {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ video: true });

  const toggle = (id: string): void => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sections: { id: string; title: string; description: string; icon: LucideIcon; component: ReactNode }[] = [
    { id: "video", title: config.labels.video, description: "محتوى فيديو تعليمي", icon: MonitorPlay, component: <VideoBlock config={config} /> },
    { id: "vocabulary", title: config.labels.vocabulary, description: "كلمات ومفردات الدرس", icon: Languages, component: <VocabularyBlock config={config} /> },
    { id: "pdf", title: config.labels.pdf, description: "ملفات ومستندات", icon: FileText, component: <PdfBlock config={config} /> },
    { id: "quiz", title: config.labels.quiz, description: "اختبار تفاعلي", icon: GraduationCap, component: <QuizBlock config={config} /> },
    { id: "homework", title: config.labels.homework, description: "واجب منزلي", icon: ClipboardList, component: <HomeworkBlock config={config} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <ContentBlock
          key={section.id}
          icon={section.icon}
          title={section.title}
          description={section.description}
          isOpen={openSections[section.id] ?? false}
          onToggle={() => toggle(section.id)}
        >
          {openSections[section.id] && section.component}
        </ContentBlock>
      ))}
    </div>
  );
}

function Check(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function X(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
