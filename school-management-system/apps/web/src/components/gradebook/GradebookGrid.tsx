'use client';

import { useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import EditableCell from './EditableCell';

interface GradeItem {
    id: string;
    name: string;
    maxScore: number;
}

interface GradeCategory {
    id: string;
    name: string;
    weight: number;
    items: GradeItem[];
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
}

interface ItemGrade {
    studentId: string;
    gradeItemId: string;
    score: number;
}

interface GradebookData {
    students: Student[];
    categories: GradeCategory[];
    itemGrades: ItemGrade[];
}

interface GradebookGridProps {
    data: GradebookData;
    sectionId: string;
    subjectId: string;
}

export default function GradebookGrid({ data, sectionId, subjectId }: GradebookGridProps) {
    const columnHelper = createColumnHelper<any>();

    // 1. Transform raw data into table rows
    // Each row represents a student and their grades mapped by gradeItemId
    const tableData = useMemo(() => {
        return data.students.map((student) => {
            const row: any = {
                studentId: student.id,
                name: `${student.lastName}, ${student.firstName} ${student.middleName?.[0] || ''}`.trim(),
            };

            // Map item grades
            data.itemGrades.forEach((grade) => {
                if (grade.studentId === student.id) {
                    row[grade.gradeItemId] = grade.score;
                }
            });

            // Calculate Weighted Grade dynamically
            let totalWeightedScore = 0;
            let totalWeightUsed = 0;

            data.categories.forEach((cat) => {
                if (cat.items.length === 0) return;

                let catEarned = 0;
                let catMax = 0;

                cat.items.forEach((item) => {
                    catMax += item.maxScore;
                    if (row[item.id] !== undefined) {
                        catEarned += row[item.id];
                    }
                });

                if (catMax > 0) {
                    // Category score percentage
                    const catPercentage = (catEarned / catMax) * 100;
                    // Add to total weighted grade
                    totalWeightedScore += (catPercentage * (cat.weight / 100));
                    totalWeightUsed += cat.weight;
                }
            });

            // Normalize in case weights don't add up to 100 yet, or items are missing
            row.weightedGrade = totalWeightUsed > 0
                ? (totalWeightedScore / totalWeightUsed) * 100
                : 0;

            return row;
        });
    }, [data]);

    // 2. Dynamically build columns based on categories and items
    const columns = useMemo(() => {
        const cols = [
            columnHelper.accessor('name', {
                header: 'Student Name',
                cell: (info) => <div className="font-medium px-2 py-1 sticky left-0">{info.getValue()}</div>,
                size: 250,
            }),
        ];

        // Group columns by Category
        data.categories.forEach((category) => {
            if (category.items.length === 0) return;

            const itemColumns = category.items.map((item) =>
                columnHelper.accessor(item.id, {
                    header: () => (
                        <div className="flex flex-col text-center">
                            <span>{item.name}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                                /{item.maxScore}
                            </span>
                        </div>
                    ),
                    cell: (info) => (
                        <EditableCell
                            initialValue={info.getValue() as number | null}
                            studentId={info.row.original.studentId}
                            gradeItemId={item.id}
                            sectionId={sectionId}
                            subjectId={subjectId}
                        />
                    ),
                    size: 100,
                })
            );

            cols.push(
                columnHelper.group({
                    id: category.id,
                    header: () => (
                        <div className="text-center font-bold text-primary">
                            {category.name} ({category.weight}%)
                        </div>
                    ),
                    columns: itemColumns,
                }) as any
            );
        });

        // Final Calculated Column
        cols.push(
            columnHelper.accessor('weightedGrade', {
                header: () => <div className="text-center font-bold">Final Grade</div>,
                cell: (info) => {
                    const val = info.getValue() as number;
                    let colorClass = "text-green-600";
                    if (val < 75) colorClass = "text-red-600";
                    else if (val < 80) colorClass = "text-orange-600";

                    return (
                        <div className={`text-center font-bold ${colorClass} px-2 py-1`}>
                            {val ? val.toFixed(2) : '0.00'}
                        </div>
                    );
                },
                size: 120,
            })
        );

        return cols;
    }, [data.categories]);

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-md border overflow-x-auto bg-white dark:bg-zinc-950">
            <Table>
                <TableHeader className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    style={{
                                        width: header.getSize(),
                                        minWidth: header.column.columnDef.minSize,
                                        maxWidth: header.column.columnDef.maxSize,
                                    }}
                                    className="border-r last:border-r-0 py-2 align-middle text-sm font-medium"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && 'selected'}
                                className="hover:bg-muted/20"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className="border-r last:border-r-0 p-0"
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                No students found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
