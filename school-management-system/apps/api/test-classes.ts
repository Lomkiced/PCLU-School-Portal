import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- TEST GET MY CLASSES ---');
    // Getting a teacher user id
    const teacher = await prisma.teacherProfile.findFirst();
    if (!teacher) { console.log('No teacher'); return; }

    console.log('Testing for teacher', teacher.id);
    const sectionSubjects = await prisma.sectionSubject.findMany({
        where: { teacherId: teacher.id },
        include: { subject: true, section: true }
    });

    console.log(JSON.stringify(sectionSubjects.map(ss => ({
        id: ss.section.id,
        subjectId: ss.subjectId,
        academicYearId: ss.academicYearId,
        subjectTaught: ss.subject.name
    })), null, 2));
}

main().finally(() => prisma.$disconnect());
