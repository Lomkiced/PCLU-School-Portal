import { PrismaClient, Role, SchoolLevel, RoomType, SubjectType, EnrollmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getHash(password: string) {
    return bcrypt.hashSync(password, 10);
}

async function main() {
    console.log('Clearing old data...');
    // In a real app we'd truncate, but here we'll just upsert or the DB should be clean

    const adminPass = getHash('admin123');
    const teacherPass = getHash('teacher123');
    const studentPass = getHash('student123');

    console.log('Creating Admin...');
    const defaultAdmin = await prisma.user.create({
        data: {
            email: 'admin@school.edu',
            passwordHash: adminPass,
            role: Role.ADMIN,
            isFirstLogin: false,
            adminProfile: {
                create: {
                    firstName: 'System',
                    lastName: 'Administrator',
                    position: 'Principal',
                }
            }
        }
    });

    console.log('Creating Academic Year...');
    const academicYear = await prisma.academicYear.create({
        data: {
            label: 'SY 2024-2025',
            startDate: new Date('2024-08-01'),
            endDate: new Date('2025-05-30'),
            isActive: true,
        }
    });

    console.log('Creating Departments...');
    const deptMath = await prisma.department.create({ data: { name: 'Mathematics' } });
    const deptSci = await prisma.department.create({ data: { name: 'Science' } });

    console.log('Creating Teachers...');
    const teachers = [];
    for (let i = 1; i <= 5; i++) {
        teachers.push(await prisma.user.create({
            data: {
                email: `teacher${i}@school.edu`,
                passwordHash: teacherPass,
                role: Role.TEACHER,
                isFirstLogin: false,
                teacherProfile: {
                    create: {
                        employeeId: `EMP-00${i}`,
                        firstName: `Teacher${i}`,
                        lastName: 'Faculty',
                        birthdate: new Date('1985-01-01'),
                        gender: i % 2 === 0 ? 'M' : 'F',
                        address: 'City',
                        contactNumber: '09000000000',
                        position: 'Teacher I',
                        departmentId: i % 2 === 0 ? deptMath.id : deptSci.id,
                    }
                }
            },
            include: { teacherProfile: true }
        }));
    }

    console.log('Creating Grade Levels...');
    const g7 = await prisma.gradeLevel.create({ data: { name: 'Grade 7', schoolLevel: SchoolLevel.JHS } });
    const g8 = await prisma.gradeLevel.create({ data: { name: 'Grade 8', schoolLevel: SchoolLevel.JHS } });
    const g9 = await prisma.gradeLevel.create({ data: { name: 'Grade 9', schoolLevel: SchoolLevel.JHS } });

    console.log('Creating Rooms...');
    const room1 = await prisma.room.create({ data: { name: 'Room 101', capacity: 40, type: RoomType.CLASSROOM, building: 'Main', floor: '1' } });
    const room2 = await prisma.room.create({ data: { name: 'Sci Lab A', capacity: 30, type: RoomType.LAB, building: 'Science', floor: '1' } });

    console.log('Creating Sections...');
    const sec7A = await prisma.section.create({ data: { name: 'Diamond', capacity: 35, gradeLevelId: g7.id, adviserId: teachers[0].teacherProfile!.id, roomId: room1.id } });
    const sec8A = await prisma.section.create({ data: { name: 'Emerald', capacity: 35, gradeLevelId: g8.id, adviserId: teachers[1].teacherProfile!.id, roomId: room1.id } });
    const sec9A = await prisma.section.create({ data: { name: 'Ruby', capacity: 35, gradeLevelId: g9.id, adviserId: teachers[2].teacherProfile!.id, roomId: room1.id } });

    console.log('Creating Subjects & Prerequisites...');
    const math7 = await prisma.subject.create({ data: { name: 'Math 7', code: 'MTH7', units: 3, subjectType: SubjectType.CORE, gradeLevelId: g7.id } });
    const math8 = await prisma.subject.create({ data: { name: 'Math 8', code: 'MTH8', units: 3, subjectType: SubjectType.CORE, gradeLevelId: g8.id, prerequisites: { connect: [{ id: math7.id }] } } });
    const sci7 = await prisma.subject.create({ data: { name: 'Science 7', code: 'SCI7', units: 3, subjectType: SubjectType.CORE, gradeLevelId: g7.id } });

    console.log('Creating Students (30 ttl)...');
    const sections = [sec7A, sec8A, sec9A];
    let studentCounter = 1;

    for (const section of sections) {
        for (let i = 1; i <= 10; i++) {
            const studentIdStr = `2024-${section.name.charAt(0)}-${i.toString().padStart(3, '0')}`;

            const sUser = await prisma.user.create({
                data: {
                    email: `student${studentCounter}@school.edu`,
                    passwordHash: studentPass,
                    role: Role.STUDENT,
                    studentProfile: {
                        create: {
                            studentId: studentIdStr,
                            firstName: `Student${studentCounter}`,
                            lastName: 'Doe',
                            birthdate: new Date('2010-01-01'),
                            gender: i % 2 === 0 ? 'M' : 'F',
                            address: 'Student Ave',
                            guardianName: 'Parent Doe',
                            guardianRelation: 'MTH',
                            guardianContact: '09990000000',
                            enrollmentStatus: EnrollmentStatus.ENROLLED,
                            sectionId: section.id,
                            gradeLevelId: section.gradeLevelId,
                        }
                    }
                },
                include: { studentProfile: true }
            });

            // Enroll student in subject
            const subjectToEnroll = section.id === sec7A.id ? math7 : math8;

            await prisma.subjectEnrollment.create({
                data: {
                    studentId: sUser.studentProfile!.id,
                    subjectId: subjectToEnroll.id,
                    sectionId: section.id,
                    academicYearId: academicYear.id,
                }
            });
            studentCounter++;
        }
    }

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
