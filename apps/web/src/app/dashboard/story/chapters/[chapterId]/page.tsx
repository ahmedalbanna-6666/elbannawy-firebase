"use client";

import { type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PlyrVideoPlayer } from "@/components/plyr-player";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MonitorPlay, Languages, FileText, GraduationCap, ClipboardList, BookOpen, Play, Eye,
} from "lucide-react";

const API_BASE = "/api/v1/content";

export default function StudentChapterContentPage(): ReactNode {
  const params = useParams();
  const user = useAuthStore((s) => s.user);
  const hydrated = typeof user?.role === "string";
  const chapterId = params.chapterId as string;
  const path = `${API_BASE}/videos/CHAPTER/${chapterId}`;

  const { data: videos = [] } = useQuery({
    queryKey: [path],
    queryFn: async () => { const res = await api.get<{ id: string; title: string; youtubeUrl: string; youtubeId: string }[]>(path); return res.data ?? []; },
    enabled: hydrated,
  });

  const { data: vocabs = [] } = useQuery({
    queryKey: [`${API_BASE}/vocabulary/CHAPTER/${chapterId}`],
    queryFn: async () => { const res = await api.get<{ id: string; word: string; translation: string; definition: string | null }[]>(`${API_BASE}/vocabulary/CHAPTER/${chapterId}`); return res.data ?? []; },
    enabled: hydrated,
  });

  const { data: doc } = useQuery({
    queryKey: [`${API_BASE}/documents/CHAPTER/${chapterId}`],
    queryFn: async () => { const res = await api.get<{ storagePath?: string; fileName: string; downloadable: boolean } | null>(`${API_BASE}/documents/CHAPTER/${chapterId}`); return res.data ?? null; },
    enabled: hydrated,
  });

  if (!hydrated) return null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      {/* Video Section */}
      {videos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <MonitorPlay className="h-5 w-5 text-red-500" />
              <h2 className="text-sm font-bold">فيديو</h2>
            </div>
            <PlyrVideoPlayer providerVideoId={videos[0]!.youtubeId} />
          </CardContent>
        </Card>
      )}

      {/* Vocabulary Section */}
      {vocabs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Languages className="h-5 w-5 text-blue-500" />
              <h2 className="text-sm font-bold">المفردات</h2>
              <Badge variant="info" className="text-[10px]">{vocabs.length} كلمة</Badge>
            </div>
            <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكلمة</TableHead>
                    <TableHead>الترجمة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vocabs.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.word}</TableCell>
                      <TableCell className="text-neutral-500">{v.translation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Section */}
      {doc && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              <h2 className="text-sm font-bold">ملف PDF</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{doc.fileName}</p>
            {doc.downloadable && doc.storagePath && (
              <a href={doc.storagePath} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:underline">
                <Eye className="h-4 w-4" /> عرض الملف
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quiz Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-500" />
            <h2 className="text-sm font-bold">اختبار الفصل</h2>
          </div>
          <p className="mt-1 text-xs text-neutral-500">قريباً</p>
        </CardContent>
      </Card>

      {/* Homework Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-500" />
            <h2 className="text-sm font-bold">واجب الفصل</h2>
          </div>
          <p className="mt-1 text-xs text-neutral-500">قريباً</p>
        </CardContent>
      </Card>
    </div>
  );
}
