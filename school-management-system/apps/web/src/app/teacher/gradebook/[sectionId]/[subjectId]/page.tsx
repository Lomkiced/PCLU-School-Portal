'use client';

import { use } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import GradebookGrid from '@/components/gradebook/GradebookGrid';
import { AddCategoryModal } from '@/components/gradebook/AddCategoryModal';
import { AddItemModal } from '@/components/gradebook/AddItemModal';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function GradebookSpreadsheetPage({
    params: paramsPromise,
    searchParams: searchParamsPromise,
}: {
    params: Promise<{ sectionId: string; subjectId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = use(paramsPromise);
    const searchParams = use(searchParamsPromise);
    const router = useRouter();

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);

    const academicYearId = (searchParams.academicYearId as string) || 'active-academic-year';

    const { data, isLoading, isError } = useQuery({
        queryKey: ['gradebookGrid', params.sectionId, params.subjectId, academicYearId],
        queryFn: async () => {
            const res = await api.get(`/grades/grid/${params.sectionId}/${params.subjectId}`, {
                params: { academicYearId }
            });
            if (!res.data?.success) {
                throw new Error('Failed to fetch gradebook');
            }
            return res.data.data;
        }
    });

    if (isLoading) return <div className="p-6">Loading gradebook...</div>;
    if (isError || !data) return <div className="p-6 text-red-500">Failed to load gradebook.</div>;

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/teacher/gradebook')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gradebook Spreadsheet</h1>
                        <p className="text-muted-foreground">
                            Section: {params.sectionId} | Subject: {params.subjectId}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </Button>
                    <Button onClick={() => setIsItemModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border rounded-lg shadow-sm w-full overflow-hidden">
                <GradebookGrid data={data} sectionId={params.sectionId} subjectId={params.subjectId} />
            </div>

            <AddCategoryModal
                open={isCategoryModalOpen}
                onOpenChange={setIsCategoryModalOpen}
                sectionId={params.sectionId}
                subjectId={params.subjectId}
                academicYearId={academicYearId}
            />

            <AddItemModal
                open={isItemModalOpen}
                onOpenChange={setIsItemModalOpen}
                sectionId={params.sectionId}
                subjectId={params.subjectId}
                academicYearId={academicYearId}
                categories={data?.categories || []}
            />
        </div>
    );
}
