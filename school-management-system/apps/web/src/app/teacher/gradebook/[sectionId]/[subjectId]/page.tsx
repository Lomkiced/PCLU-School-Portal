'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import GradebookGrid from '@/components/gradebook/GradebookGrid';
import { api } from '@/lib/api';

export default function GradebookSpreadsheetPage({
    params: paramsPromise,
}: {
    params: Promise<{ sectionId: string; subjectId: string }>;
}) {
    const params = use(paramsPromise);
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const academicYearId = 'active-academic-year'; // In real app, fetch from context

    useEffect(() => {
        // Fetch Gradebook Data
        const fetchGradebook = async () => {
            try {
                const res = await api.get(`/grades/grid/${params.sectionId}/${params.subjectId}`, {
                    params: { academicYearId }
                });
                if (res.data?.success) {
                    setData(res.data.data);
                } else {
                    console.error('Failed to fetch gradebook', res.data);
                    // Mock data for development if API fails or isn't hooked up to proxy
                    setData({
                        students: [
                            { id: 'st-1', firstName: 'John', lastName: 'Doe' },
                            { id: 'st-2', firstName: 'Jane', lastName: 'Smith' },
                        ],
                        categories: [
                            {
                                id: 'cat-1', name: 'Quizzes', weight: 40, items: [
                                    { id: 'item-1', name: 'Quiz 1', maxScore: 100 },
                                    { id: 'item-2', name: 'Quiz 2', maxScore: 100 }
                                ]
                            },
                        ],
                        itemGrades: [
                            { studentId: 'st-1', gradeItemId: 'item-1', score: 85 },
                            { studentId: 'st-2', gradeItemId: 'item-1', score: 92 },
                        ]
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGradebook();
    }, [params.sectionId, params.subjectId]);

    if (loading) return <div className="p-6">Loading gradebook...</div>;
    if (!data) return <div className="p-6">Failed to load gradebook.</div>;

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
                    <Button variant="secondary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </Button>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border rounded-lg shadow-sm w-full overflow-hidden">
                <GradebookGrid data={data} sectionId={params.sectionId} subjectId={params.subjectId} />
            </div>
        </div>
    );
}
