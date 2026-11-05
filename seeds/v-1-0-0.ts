import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

/**
 * Helper to idempotently get or create a User + AuthAccount.
 */
async function getOrCreateUser(
  trx: Knex.Transaction,
  data: {
    username: string;
    displayName: string;
    email: string;
    phoneNumber?: string;
    role: 'admin' | 'user';
    currentMode: 'student' | 'tutor';
    passwordHash: string;
  }
): Promise<{ userId: string }> {
  const existing = await trx('User')
    .whereRaw('lower("email") = ? OR lower("username") = ?', [data.email.toLowerCase(), data.username.toLowerCase()])
    .first<{ userId: string }>();

  if (existing) {
    return existing;
  }

  const [inserted] = await trx('User')
    .insert({
      username: data.username,
      displayName: data.displayName,
      email: data.email,
      phoneNumber: data.phoneNumber || null,
      emailVerifiedAt: new Date(),
      role: data.role,
      status: 'normal',
      language: 'th',
      currentMode: data.currentMode,
    })
    .returning('userId');

  await trx('AuthAccount').insert({
    userId: inserted.userId,
    provider: 'basic',
    passwordHash: data.passwordHash,
  });

  return inserted;
}

/**
 * Helper to idempotently get or create a StudentProfile for a user.
 */
async function getOrCreateStudentProfile(
  trx: Knex.Transaction,
  userId: string,
  extra?: {
    currentGradeLevel?: string;
    schoolName?: string;
    longitude?: number;
    latitude?: number;
    parentName?: string;
    parentPhone?: string;
    emergencyContact?: Record<string, unknown>;
  }
): Promise<{ studentProfileId: string }> {
  const existing = await trx('StudentProfile')
    .where({ userId })
    .first<{ studentProfileId: string }>();

  const payload: Record<string, unknown> = {
    currentGradeLevel: extra?.currentGradeLevel ?? null,
    schoolName: extra?.schoolName ?? null,
    parentName: extra?.parentName ?? null,
    parentPhone: extra?.parentPhone ?? null,
    emergencyContact: extra?.emergencyContact ?? null,
    isActiveFlag: true,
    updatedBy: 'system',
  };
  if (extra?.longitude !== undefined && extra?.latitude !== undefined) {
    payload.location = trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [extra.longitude, extra.latitude]);
  }

  if (existing) {
    if (extra) {
      await trx('StudentProfile').where({ studentProfileId: existing.studentProfileId }).update(payload);
    }
    return existing;
  }

  const [inserted] = await trx('StudentProfile')
    .insert({
      userId,
      ...payload,
      createdBy: 'system',
    })
    .returning('studentProfileId');

  return inserted;
}

/**
 * v-1-0-0 - Rich initial seed data for TewsDay (Admin, Subjects, Tutors, Students, Jobs, Bookings, Sessions, Reviews, Chat, Invoices).
 * Safe to re-run (idempotent checks per section).
 */
export async function seed(knex: Knex): Promise<void> {
  const passwordHash = await bcrypt.hash('SomePassword1234', 10);

  await knex.transaction(async (trx) => {
    // -------------------------------------------------------------------------
    // 1. Default Admin Account (admin@myapp.com / SomePassword1234)
    // -------------------------------------------------------------------------
    const adminUser = await getOrCreateUser(trx, {
      username: 'admin',
      displayName: 'TewsDay Administrator',
      email: 'admin@myapp.com',
      role: 'admin',
      currentMode: 'student',
      passwordHash,
    });

    // -------------------------------------------------------------------------
    // 2. Subjects (8 Core Subjects)
    // -------------------------------------------------------------------------
    const subjectSeeds = [
      {
        name: 'คณิตศาสตร์ประยุกต์ (A-Level & TGAT)',
        category: 'Mathematics',
        description: 'ติวเข้มคณิตศาสตร์ ม.ปลาย, เซต, ตรรกศาสตร์, แคลคูลัสเบื้องต้น และตะลุยโจทย์ A-Level 1 & 2',
      },
      {
        name: 'แคลคูลัสระดับมหาวิทยาลัย (Calculus I & II)',
        category: 'Mathematics',
        description: 'ลิมิต ความต่อเนื่อง อนุพันธ์ ปริพันธ์ สมการเชิงอนุพันธ์ สำหรับนิสิตนักศึกษาวิศวะและวิทยาศาสตร์',
      },
      {
        name: 'ฟิสิกส์ ม.ปลาย และวิศวกรรม (Physics)',
        category: 'Science',
        description: 'กลศาสตร์ ไฟฟ้า แม่เหล็ก คลื่น ของไหล อุณหพลศาสตร์ และฟิสิกส์มหาวิทยาลัย',
      },
      {
        name: 'เคมี ม.ปลาย (A-Level Chemistry)',
        category: 'Science',
        description: 'ปริมาณสารสัมพันธ์ เคมีอินทรีย์ กรด-เบส ไฟฟ้าเคมี และเทคนิคทำข้อสอบ A-Level เคมี',
      },
      {
        name: 'ชีววิทยา (A-Level Biology)',
        category: 'Science',
        description: 'สรีรวิทยา พันธุศาสตร์ ระบบนิเวศ เซลล์และการแบ่งเซลล์ สรุปภาพจำเข้าใจง่าย',
      },
      {
        name: 'ภาษาอังกฤษ (IELTS / TGAT Eng)',
        category: 'Language',
        description: 'Listening, Reading, Writing, Speaking สำหรับสอบ IELTS, TOEIC และ TGAT1',
      },
      {
        name: 'การเขียนโปรแกรม Python & Data Science',
        category: 'Computer Science',
        description: 'พื้นฐานการเขียนโปรแกรม Python, โครงสร้างข้อมูล, อัลกอริทึม และวิเคราะห์ข้อมูลด้วย Pandas',
      },
      {
        name: 'Web Development (TypeScript, React & Node.js)',
        category: 'Computer Science',
        description: 'พัฒนาเว็บไซต์แบบ Full-Stack ด้วย TypeScript, React, Next.js, Express และ PostgreSQL',
      },
    ];

    const subjectMap: Record<string, string> = {};
    for (const item of subjectSeeds) {
      const existing = await trx('Subject')
        .whereRaw('lower("name") = ?', [item.name.toLowerCase()])
        .andWhere({ isActiveFlag: true })
        .first<{ subjectId: string }>();

      if (existing) {
        subjectMap[item.name] = existing.subjectId;
      } else {
        const [inserted] = await trx('Subject')
          .insert({
            name: item.name,
            category: item.category,
            description: item.description,
            isActiveFlag: true,
            createdBy: 'system',
            updatedBy: 'system',
          })
          .returning('subjectId');
        subjectMap[item.name] = inserted.subjectId;
      }
    }

    // Check if demo invoice already exists; if so, skip the demo marketplace records
    const existingDemoInvoice = await trx('Invoice')
      .where({ invoiceNumber: 'INV-COMM-202611-001' })
      .first<{ invoiceId: string }>();
    if (existingDemoInvoice) {
      return;
    }

    // -------------------------------------------------------------------------
    // 3. Tutors (3 Tutors with Profiles, Subjects, Education, Availability)
    // -------------------------------------------------------------------------
    // Tutor 1: ครูพี่นนท์ วิศวะ จุฬาฯ (Verified, Hybrid, Siam/Samyan)
    const tutorNonUser = await getOrCreateUser(trx, {
      username: 'tutor_non',
      displayName: 'ครูพี่นนท์ วิศวะ จุฬาฯ',
      email: 'tutor.non@tewsday.com',
      phoneNumber: '0812345601',
      role: 'user',
      currentMode: 'tutor',
      passwordHash,
    });

    await getOrCreateStudentProfile(trx, tutorNonUser.userId);

    const [tutorNonProfile] = await trx('TutorProfile')
      .insert({
        userId: tutorNonUser.userId,
        bio: 'ติวเตอร์วิศวะคอมฯ จุฬาฯ ประสบการณ์สอนคณิตศาสตร์ แคลคูลัส และฟิสิกส์กว่า 5 ปี เน้นเข้าใจที่มาของสูตร ไม่เน้นท่องจำ พาน้องสอบติดวิศวะและแพทย์มาแล้วกว่า 40 คน',
        hourlyRate: 550,
        teachingLocationType: 'hybrid',
        location: trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [100.5321, 13.7384]),
        serviceRadiusKm: 15,
        paymentDetails: {
          bankName: 'KBANK',
          accountName: 'นนทพัทธ์ เกียรติขจร',
          accountNumber: '123-4-56789-0',
          promptPay: '0812345601',
        },
        verificationStatus: 'verified',
        introVideoStatus: 'approved',
        popularityScore: 4.85,
        isActiveFlag: true,
        createdBy: 'system',
        updatedBy: 'system',
      })
      .returning('tutorProfileId');

    await trx('TutorSubject').insert([
      {
        tutorProfileId: tutorNonProfile.tutorProfileId,
        subjectId: subjectMap['คณิตศาสตร์ประยุกต์ (A-Level & TGAT)'],
        proficiencyLevel: 'Expert',
        gradeLevels: ['ม.4', 'ม.5', 'ม.6'],
        specializedTopics: ['แคลคูลัสเบื้องต้น', 'ตรีโกณมิติ', 'ความน่าจะเป็น', 'ตะลุยโจทย์ A-Level 1'],
        customHourlyRate: 550,
      },
      {
        tutorProfileId: tutorNonProfile.tutorProfileId,
        subjectId: subjectMap['แคลคูลัสระดับมหาวิทยาลัย (Calculus I & II)'],
        proficiencyLevel: 'Expert',
        gradeLevels: ['มหาวิทยาลัย ปี 1', 'มหาวิทยาลัย ปี 2'],
        specializedTopics: ['Limits', 'Derivatives', 'Multiple Integrals', 'Differential Equations'],
        customHourlyRate: 600,
      },
      {
        tutorProfileId: tutorNonProfile.tutorProfileId,
        subjectId: subjectMap['ฟิสิกส์ ม.ปลาย และวิศวกรรม (Physics)'],
        proficiencyLevel: 'Advanced',
        gradeLevels: ['ม.4', 'ม.5', 'ม.6', 'มหาวิทยาลัย ปี 1'],
        specializedTopics: ['กลศาสตร์', 'ไฟฟ้ากระแสตรง-สลับ', 'คลื่นและแสง'],
        customHourlyRate: 550,
      },
    ]);

    await trx('TutorEducation').insert({
      tutorProfileId: tutorNonProfile.tutorProfileId,
      institution: 'จุฬาลงกรณ์มหาวิทยาลัย',
      degree: 'วิศวกรรมศาสตรบัณฑิต (เกียรตินิยมอันดับ 1)',
      fieldOfStudy: 'วิศวกรรมคอมพิวเตอร์',
      graduationYear: 2024,
      isVerifiedFlag: true,
    });

    await trx('TutorAvailability').insert([
      {
        tutorProfileId: tutorNonProfile.tutorProfileId,
        dayOfWeek: 6, // Saturday
        startTime: '09:00',
        endTime: '12:00',
        isAvailableFlag: true,
      },
      {
        tutorProfileId: tutorNonProfile.tutorProfileId,
        dayOfWeek: 6, // Saturday
        startTime: '13:00',
        endTime: '17:00',
        isAvailableFlag: true,
      },
      {
        tutorProfileId: tutorNonProfile.tutorProfileId,
        dayOfWeek: 0, // Sunday
        startTime: '09:00',
        endTime: '16:00',
        isAvailableFlag: true,
      },
    ]);

    // Tutor 2: ครูพี่พลอย อักษรฯ จุฬาฯ (Verified, Online, Asok)
    const tutorPloiUser = await getOrCreateUser(trx, {
      username: 'tutor_ploi',
      displayName: 'ครูพี่พลอย อักษรฯ จุฬาฯ (IELTS 8.5)',
      email: 'tutor.ploi@tewsday.com',
      phoneNumber: '0812345602',
      role: 'user',
      currentMode: 'tutor',
      passwordHash,
    });

    await getOrCreateStudentProfile(trx, tutorPloiUser.userId);

    const [tutorPloiProfile] = await trx('TutorProfile')
      .insert({
        userId: tutorPloiUser.userId,
        bio: 'จบอักษรศาสตร์ จุฬาฯ เกียรตินิยมอันดับ 1 คะแนน IELTS Overall 8.5 เชี่ยวชาญการติว IELTS Writing & Speaking และ TGAT1 ภาษาอังกฤษ มีเทคนิคแกะ Reading ไวไม่ต้องแปลทุกคำ',
        hourlyRate: 600,
        teachingLocationType: 'online',
        location: trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [100.5614, 13.7367]),
        serviceRadiusKm: 10,
        paymentDetails: {
          bankName: 'SCB',
          accountName: 'พลอยไพลิน วัฒนา',
          accountNumber: '405-9-87654-3',
          promptPay: '0812345602',
        },
        verificationStatus: 'verified',
        introVideoStatus: 'approved',
        popularityScore: 4.92,
      })
      .returning('tutorProfileId');

    await trx('TutorSubject').insert({
      tutorProfileId: tutorPloiProfile.tutorProfileId,
      subjectId: subjectMap['ภาษาอังกฤษ (IELTS / TGAT Eng)'],
      proficiencyLevel: 'Native / C2 (IELTS 8.5)',
      gradeLevels: ['ม.4', 'ม.5', 'ม.6', 'มหาวิทยาลัย', 'บุคคลทั่วไป'],
      specializedTopics: ['IELTS Academic Writing', 'IELTS Speaking Part 1-3', 'TGAT1 English Communication'],
      customHourlyRate: 600,
    });

    await trx('TutorEducation').insert({
      tutorProfileId: tutorPloiProfile.tutorProfileId,
      institution: 'จุฬาลงกรณ์มหาวิทยาลัย',
      degree: 'อักษรศาสตรบัณฑิต (เกียรตินิยมอันดับ 1)',
      fieldOfStudy: 'ภาษาอังกฤษ',
      graduationYear: 2023,
      isVerifiedFlag: true,
    });

    await trx('TutorAvailability').insert([
      {
        tutorProfileId: tutorPloiProfile.tutorProfileId,
        dayOfWeek: 2, // Tuesday
        startTime: '18:00',
        endTime: '21:00',
        isAvailableFlag: true,
      },
      {
        tutorProfileId: tutorPloiProfile.tutorProfileId,
        dayOfWeek: 4, // Thursday
        startTime: '18:00',
        endTime: '21:00',
        isAvailableFlag: true,
      },
      {
        tutorProfileId: tutorPloiProfile.tutorProfileId,
        dayOfWeek: 6, // Saturday
        startTime: '10:00',
        endTime: '16:00',
        isAvailableFlag: true,
      },
    ]);

    // Tutor 3: พี่มาร์ค Full-Stack & Python (Pending Verification, Hybrid, Chatuchak)
    const tutorMarkUser = await getOrCreateUser(trx, {
      username: 'tutor_mark',
      displayName: 'พี่มาร์ค Full-Stack & Python',
      email: 'tutor.mark@tewsday.com',
      phoneNumber: '0812345603',
      role: 'user',
      currentMode: 'tutor',
      passwordHash,
    });

    await getOrCreateStudentProfile(trx, tutorMarkUser.userId);

    const [tutorMarkProfile] = await trx('TutorProfile')
      .insert({
        userId: tutorMarkUser.userId,
        bio: 'Software Engineer ประสบการณ์ทำงานจริง รับสอนเขียนโปรแกรม Python ตั้งแต่ 0 จนทำโปรเจกต์ได้จริง รวมถึงติววิชา Com Prog มหาวิทยาลัย และ Web Dev (React / TypeScript / Node.js)',
        hourlyRate: 650,
        teachingLocationType: 'hybrid',
        location: trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [100.5467, 13.814]),
        serviceRadiusKm: 20,
        paymentDetails: {
          bankName: 'KTB',
          accountName: 'มาร์ค อัศวเดช',
          accountNumber: '987-6-54321-0',
          promptPay: '0812345603',
        },
        verificationStatus: 'pending',
        introVideoStatus: 'pendingReview',
        popularityScore: 4.5,
      })
      .returning('tutorProfileId');

    await trx('TutorSubject').insert([
      {
        tutorProfileId: tutorMarkProfile.tutorProfileId,
        subjectId: subjectMap['การเขียนโปรแกรม Python & Data Science'],
        proficiencyLevel: 'Expert',
        gradeLevels: ['ม.ปลาย', 'มหาวิทยาลัย ปี 1-4', 'บุคคลทั่วไป'],
        specializedTopics: ['Python 101', 'Data Structures & Algorithms', 'Pandas & Data Visualization'],
        customHourlyRate: 650,
      },
      {
        tutorProfileId: tutorMarkProfile.tutorProfileId,
        subjectId: subjectMap['Web Development (TypeScript, React & Node.js)'],
        proficiencyLevel: 'Expert',
        gradeLevels: ['มหาวิทยาลัย ปี 1-4', 'บุคคลทั่วไป'],
        specializedTopics: ['TypeScript', 'React & Next.js', 'REST API with Node.js & PostgreSQL'],
        customHourlyRate: 700,
      },
    ]);

    await trx('TutorEducation').insert({
      tutorProfileId: tutorMarkProfile.tutorProfileId,
      institution: 'มหาวิทยาลัยเกษตรศาสตร์',
      degree: 'วิทยาศาสตรบัณฑิต',
      fieldOfStudy: 'วิทยาการคอมพิวเตอร์',
      graduationYear: 2024,
      isVerifiedFlag: false,
    });

    await trx('TutorAvailability').insert([
      {
        tutorProfileId: tutorMarkProfile.tutorProfileId,
        dayOfWeek: 3, // Wednesday
        startTime: '19:00',
        endTime: '22:00',
        isAvailableFlag: true,
      },
      {
        tutorProfileId: tutorMarkProfile.tutorProfileId,
        dayOfWeek: 0, // Sunday
        startTime: '13:00',
        endTime: '18:00',
        isAvailableFlag: true,
      },
    ]);

    await trx('ProfileChangeRequest').insert({
      tutorProfileId: tutorMarkProfile.tutorProfileId,
      requestedChanges: {
        degree: 'วิทยาศาสตรบัณฑิต (เกียรตินิยมอันดับ 2)',
        graduationYear: 2024,
      },
      status: 'pending',
    });

    // -------------------------------------------------------------------------
    // 4. Students (2 Students with StudentProfile)
    // -------------------------------------------------------------------------
    // Student 1: น้องมิน เตรียมอุดมฯ ม.6
    const studentMinUser = await getOrCreateUser(trx, {
      username: 'student_min_demo',
      displayName: 'น้องมิน เตรียมอุดมฯ ม.6',
      email: 'student.min@tewsday.com',
      phoneNumber: '0891112233',
      role: 'user',
      currentMode: 'student',
      passwordHash,
    });

    const studentMinProfile = await getOrCreateStudentProfile(trx, studentMinUser.userId, {
      currentGradeLevel: 'ม.6',
      schoolName: 'โรงเรียนเตรียมอุดมศึกษา',
      longitude: 100.5304,
      latitude: 13.7401,
      parentName: 'คุณแม่สมศรี',
      parentPhone: '0891112222',
      emergencyContact: {
        relationship: 'มารดา',
        lineId: '@mom_somsri',
      },
    });

    // Student 2: น้องอาร์ม ปี 1 วิศวะ
    const studentArmUser = await getOrCreateUser(trx, {
      username: 'student_arm',
      displayName: 'น้องอาร์ม ปี 1 วิศวะ',
      email: 'student.arm@tewsday.com',
      phoneNumber: '0894445566',
      role: 'user',
      currentMode: 'student',
      passwordHash,
    });

    const studentArmProfile = await getOrCreateStudentProfile(trx, studentArmUser.userId, {
      currentGradeLevel: 'มหาวิทยาลัย ปี 1',
      schoolName: 'จุฬาลงกรณ์มหาวิทยาลัย',
      longitude: 100.525,
      latitude: 13.735,
      parentName: 'คุณพ่อวิชัย',
      parentPhone: '0819998888',
      emergencyContact: {
        relationship: 'บิดา',
      },
    });

    // -------------------------------------------------------------------------
    // 5. Marketplace Student Jobs & Applications
    // -------------------------------------------------------------------------
    const futureExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const [jobMath] = await trx('StudentJob')
      .insert({
        studentProfileId: studentMinProfile.studentProfileId,
        subjectId: subjectMap['คณิตศาสตร์ประยุกต์ (A-Level & TGAT)'],
        targetGradeLevel: 'ม.6',
        topics: ['แคลคูลัสเบื้องต้น', 'ลำดับและอนุกรม', 'ตะลุยโจทย์ A-Level 1'],
        learningGoal: 'เตรียมสอบเข้าคณะวิศวกรรมศาสตร์ จุฬาฯ ต้องการพี่ติวเตอร์ช่วยสรุปเทคนิคทำโจทย์เร็วและตรวจการบ้านทุกสัปดาห์',
        budgetMin: 450,
        budgetMax: 600,
        locationType: 'hybrid',
        location: trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [100.5304, 13.7401]),
        frequencyPerWeek: 2,
        preferredDays: JSON.stringify(['Saturday', 'Sunday']),
        status: 'open',
        expiredAt: futureExpiry,
      })
      .returning('studentJobId');

    const [jobIelts] = await trx('StudentJob')
      .insert({
        studentProfileId: studentMinProfile.studentProfileId,
        subjectId: subjectMap['ภาษาอังกฤษ (IELTS / TGAT Eng)'],
        targetGradeLevel: 'ม.6',
        topics: ['IELTS Writing Task 1-2', 'IELTS Speaking'],
        learningGoal: 'ต้องการอัปคะแนน IELTS จาก 6.0 เป็น 7.0 ภายใน 2 เดือน เน้นตรวจ Writing และซ้อม Speaking ตัวต่อตัว',
        budgetMin: 500,
        budgetMax: 700,
        locationType: 'online',
        frequencyPerWeek: 2,
        preferredDays: JSON.stringify(['Tuesday', 'Thursday']),
        status: 'open',
        expiredAt: futureExpiry,
      })
      .returning('studentJobId');

    await trx('StudentJob').insert({
      studentProfileId: studentArmProfile.studentProfileId,
      subjectId: subjectMap['แคลคูลัสระดับมหาวิทยาลัย (Calculus I & II)'],
      targetGradeLevel: 'มหาวิทยาลัย ปี 1',
      topics: ['Limits & Continuity', 'Integration Techniques', 'Improper Integrals'],
      learningGoal: 'ติวก่อนสอบมิดเทอมและไฟนอลวิชา Calculus I คณะวิศวะ เน้นทำข้อสอบเก่า',
      budgetMin: 500,
      budgetMax: 650,
      locationType: 'hybrid',
      location: trx.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [100.525, 13.735]),
      frequencyPerWeek: 1,
      preferredDays: JSON.stringify(['Sunday']),
      status: 'open',
      expiredAt: futureExpiry,
    });

    // Job Applications
    await trx('JobApplication').insert([
      {
        studentJobId: jobMath.studentJobId,
        tutorProfileId: tutorNonProfile.tutorProfileId,
        proposedRate: 550,
        proposedAvailability: JSON.stringify(['Saturday 09:00-11:00', 'Sunday 13:00-15:00']),
        coverMessage: 'สวัสดีครับน้องมิน พี่นนท์มีชีทสรุป A-Level คณิต 1 และข้อสอบเก่าย้อนหลัง 10 ปีพร้อมเฉลยละเอียดครับ',
        status: 'pending',
      },
      {
        studentJobId: jobIelts.studentJobId,
        tutorProfileId: tutorPloiProfile.tutorProfileId,
        proposedRate: 600,
        proposedAvailability: JSON.stringify(['Tuesday 18:00-20:00', 'Thursday 18:00-20:00']),
        coverMessage: 'สวัสดีค่ะน้องมิน พี่พลอยช่วยตรวจ Essay แบบละเอียดทุกประโยคพร้อมเก็งหัวข้อ Speaking ล่าสุดให้ได้เลยค่ะ',
        status: 'pending',
      },
    ]);

    // -------------------------------------------------------------------------
    // 6. Demo Booking, Class Sessions, Review, Invoice & Chat
    // -------------------------------------------------------------------------
    const [demoBooking] = await trx('Booking')
      .insert({
        studentProfileId: studentMinProfile.studentProfileId,
        tutorProfileId: tutorNonProfile.tutorProfileId,
        subjectId: subjectMap['คณิตศาสตร์ประยุกต์ (A-Level & TGAT)'],
        originatingStudentJobId: jobMath.studentJobId,
        agreedHourlyRate: 550,
        teachingMode: 'online',
        meetingUrl: 'https://meet.google.com/tew-sday-min',
        status: 'active',
      })
      .returning('bookingId');

    const pastStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(pastStart.getTime() + 2 * 60 * 60 * 1000);
    const nextWeekStart = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(nextWeekStart.getTime() + 2 * 60 * 60 * 1000);

    // Session 1: Completed & Confirmed (2 hours = 1,100 THB)
    const [completedSession] = await trx('ClassSession')
      .insert({
        bookingId: demoBooking.bookingId,
        studentProfileId: studentMinProfile.studentProfileId,
        tutorProfileId: tutorNonProfile.tutorProfileId,
        scheduledStart: pastStart,
        scheduledEnd: pastEnd,
        actualStart: pastStart,
        actualEnd: pastEnd,
        completionClaimedAt: pastEnd,
        hourlyRate: 550,
        durationMinutes: 120,
        grossAmount: 1100,
        lessonFeedback: 'น้องมินพื้นฐานดีมาก วันนี้ปูเรื่องลิมิตและอนุพันธ์เสร็จครบตามแผน',
        homeworkAssigned: 'ทำโจทย์ท้ายบทแคลคูลัส ข้อ 1-20 ส่งก่อนคลาสหน้า',
        status: 'completed',
        paymentStatus: 'tutorConfirmed',
        studentConfirmedAt: new Date(pastEnd.getTime() + 30 * 60 * 1000),
        tutorConfirmedAt: pastEnd,
      })
      .returning('classSessionId');

    // Session 2: Scheduled for upcoming week
    await trx('ClassSession').insert({
      bookingId: demoBooking.bookingId,
      studentProfileId: studentMinProfile.studentProfileId,
      tutorProfileId: tutorNonProfile.tutorProfileId,
      scheduledStart: nextWeekStart,
      scheduledEnd: nextWeekEnd,
      hourlyRate: 550,
      durationMinutes: 120,
      grossAmount: 1100,
      status: 'scheduled',
      paymentStatus: 'pendingPayment',
    });

    // Review on Completed Session
    await trx('Review').insert({
      classSessionId: completedSession.classSessionId,
      reviewerUserId: studentMinUser.userId,
      revieweeUserId: tutorNonUser.userId,
      tutorProfileId: tutorNonProfile.tutorProfileId,
      reviewType: 'studentToTutor',
      ratingScore: 5,
      comment: 'พี่นนท์สอนเข้าใจง่ายมากค่ะ จากที่งงเรื่องแคลคูลัส ตอนนี้ทำโจทย์ A-Level ได้เองแล้ว!',
      isPublishedFlag: true,
    });

    // Commission Invoice for Tutor Non (10% of 1,100 THB = 110 THB)
    const [demoInvoice] = await trx('Invoice')
      .insert({
        invoiceNumber: 'INV-COMM-202611-001',
        invoiceType: 'tutorCommission',
        bookingId: demoBooking.bookingId,
        payerUserId: tutorNonUser.userId,
        payeeUserId: adminUser.userId,
        billingPeriodStart: new Date('2026-11-01'),
        billingPeriodEnd: new Date('2026-11-30'),
        commissionRateSnapshot: 0.1,
        amount: 110,
        commissionFee: 110,
        status: 'unpaid',
        dueDate: new Date('2026-12-05'),
      })
      .returning('invoiceId');

    await trx('InvoiceItem').insert({
      invoiceId: demoInvoice.invoiceId,
      classSessionId: completedSession.classSessionId,
      sessionGrossAmount: 1100,
      commissionRate: 0.1,
      commissionAmount: 110,
    });

    // Conversation & Messages between Student Min & Tutor Non
    const [demoConversation] = await trx('Conversation')
      .insert({
        studentProfileId: studentMinProfile.studentProfileId,
        tutorProfileId: tutorNonProfile.tutorProfileId,
        bookingId: demoBooking.bookingId,
        lastMessageAt: new Date(),
      })
      .returning('conversationId');

    await trx('Message').insert([
      {
        conversationId: demoConversation.conversationId,
        senderUserId: studentMinUser.userId,
        messageType: 'text',
        content: 'สวัสดีค่ะพี่นนท์ เสาร์หน้าเรียนเวลาเดิม 09:00 น. ใช่ไหมคะ?',
        isReadFlag: true,
        readAt: new Date(),
      },
      {
        conversationId: demoConversation.conversationId,
        senderUserId: tutorNonUser.userId,
        messageType: 'text',
        content: 'ใช่ครับน้องมิน เดี๋ยวพี่ส่งไฟล์ชีทชุดใหม่ให้ในแชทนี้ก่อนเริ่มเรียนนะครับ',
        isReadFlag: false,
      },
    ]);

    // Notifications
    await trx('Notification').insert([
      {
        userId: studentMinUser.userId,
        priorityTier: 'high',
        title: 'ติวเตอร์ยื่นข้อเสนอสอนในประกาศงานของคุณ',
        body: 'ครูพี่นนท์ วิศวะ จุฬาฯ ได้ส่งใบสมัครสอนในวิชา คณิตศาสตร์ประยุกต์ (A-Level & TGAT)',
        referenceType: 'StudentJob',
        referenceId: jobMath.studentJobId,
        isReadFlag: false,
      },
      {
        userId: tutorNonUser.userId,
        priorityTier: 'medium',
        title: 'นักเรียนยืนยันการเข้าเรียนเรียบร้อยแล้ว',
        body: 'น้องมิน เตรียมอุดมฯ ม.6 ยืนยันการเข้าเรียนและเขียนรีวิว 5 ดาวให้คลาสของคุณ',
        referenceType: 'ClassSession',
        referenceId: completedSession.classSessionId,
        isReadFlag: false,
      },
    ]);
  });
}
