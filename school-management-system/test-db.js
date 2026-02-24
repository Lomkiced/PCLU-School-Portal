const { PrismaClient } = require('./packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ays = await prisma.academicYear.findMany();
    if (ays.length === 0) return;
    const ay = ays[0];

    // Get a section, a subject, a teacher
    const teacher = await prisma.teacherProfile.findFirst();
    const section = await prisma.section.findFirst();
    const subject = await prisma.subject.findFirst();
    const room = await prisma.room.findFirst();

    if (!teacher || !section || !subject) {
        console.log("Missing test data: Teacher, Section, or Subject. Seeding basic generic ones...");
        // This is a complex DB, we assume they have at least one of each from earlier steps.
    } else {
        // Create an assignment
        const exists = await prisma.sectionSubject.findFirst({
            where: { sectionId: section.id, subjectId: subject.id, academicYearId: ay.id }
        });

        if (!exists) {
            await prisma.sectionSubject.create({
                data: {
                    teacherId: teacher.id,
                    sectionId: section.id,
                    subjectId: subject.id,
                    academicYearId: ay.id
                }
            });
            console.log("Successfully created 1 SectionSubject assignment for testing!");
        } else {
            console.log("SectionSubject already exists.");
        }
    }
}

main().finally(() => prisma.$disconnect());
