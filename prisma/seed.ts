import { EmploymentType, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed () {
  await prisma.employmentPreference.deleteMany();
  await prisma.employmentType.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.kycDoc.deleteMany();
  await prisma.priorLoan.deleteMany();
  await prisma.application.deleteMany();
  await prisma.lender.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.create({
    data: {
      emailAddress: "admin@example.com",
      hashedPassword: await bcrypt.hash("jarnbjorn@8901", 10),
      fullName: "Admin Doe",
      kind: "Admin",
    }
  });
  const lenderUser = await prisma.user.create({
    data: {
      emailAddress: "lender@example.com",
      hashedPassword: await bcrypt.hash("jarnbjorn@8901", 10),
      fullName: "Lender Doe",
      kind: "Lender",
    }
  });
  const applicant = await prisma.user.create({
    data: {
      emailAddress: "you@example.com",
      hashedPassword: await bcrypt.hash("jarnbjorn@8901", 10),
      fullName: "John Doe",
      kind: "Applicant",
    }
  });
  const lender = await prisma.lender.create({
    data: {
      userId: lenderUser.id,
      logo: '',
      logoPublicId: "h2bkwgii1e28hltu7f99",
      logoWidth: 200,
      logoHeight: 200,
      minTenure: 1,
      maxTenure: 5,
      minAmount: 2000,
      maxAmount: 10000,
      monthlyInterest: 5.75,
      adminFee: 2.50,
      applicationFee: 1.25,
      paid: false,
    },
  });
  const application = await prisma.application.create({
    data: {
      applicantId: applicant.id,

      state: 'Approved',
      moreDetail: 'Description Example...',

      bank: 'CBZ',
      bankBranch: 'Nelson Mandela, Harare',
      accNumber: '1234567890',
      accName: 'Peter Moyo',

      loanPurpose: 'Farming Capital',
      amtRequired: 12500,
      repaymentPeriod: 3,

      title: 'Mr.',
      fullName: 'Peter Moyo',
      DOB: new Date(1995, 4, 13),
      nationalID: '70-279423-B-30',
      phoneNumber: '+263739083125',
      resAddress: '2131 Place, Harare',
      natureOfRes: 'Rented',

      fullMaidenNames: '',
      fullNameOfSpouse: 'Jane Doe',
      maritalStatus: 'Married',

      profession: 'Banker',
      employer: 'CBZ',
      employedSince: new Date(2013, 4, 9),
      grossIncome: 4200,
      netIncome: 3800,

      firstNokFullName: 'Adam Person',
      firstNokRelationship: 'Uncle',
      firstNokEmployer: 'CABS',
      firstNokResAddress: '4342 Another Place, Harare',
      firstNokPhoneNumber: '+263772456321',

      secondNokFullName: 'Moses Dube',
      secondNokRelationship: 'Brother',
      secondNokEmployer: 'NMB',
      secondNokResAddress: '2334 Place, Harare',
      secondNokPhoneNumber: '+263772456321',
    }
  });
  await prisma.priorLoan.create({
    data: {
      applicationId: application.id,
      lender: "Club Plus",
      expiryDate: new Date(2023, 4, 5),
      amount: 4000,
      monthlyRepayment: 250,
      balance: 750,
    }
  });
  await prisma.kycDoc.createMany({
    data: [
      {
        applicationId: application.id,
        label: "National-ID/Passport",
        publicId: "h2bkwgii1e28hltu7f99",
        width: 3200,
        height: 2400,
      },
      {
        applicationId: application.id,
        label: "Proof of Residence",
        publicId: "h2bkwgii1e28hltu7f99",
        width: 3200,
        height: 2400,
      },
      {
        applicationId: application.id,
        label: "Pay Slip",
        publicId: "h2bkwgii1e28hltu7f99",
        width: 3200,
        height: 2400,
      },
    ],
  });
  const channel = await prisma.channel.create({
    data: {
      applicationId: application.id,
      lenderId: lender.id,
    }
  });
  await prisma.decision.create({
    data: {
      channelId: channel.id,
      decision: 'Approved',
      comment: 'Comment example...',
    }
  });
  const typesToAdd = [
    'SSB',
    'Entrepreneur',
    'HeadHunters',
    'Inscor Worker'
  ];
  const employmentTypes: EmploymentType[] = [];
  await Promise.all(typesToAdd.map(async (employmentType) => {
    const added = await prisma.employmentType.create({
      data: { employmentType },
    });
    employmentTypes.push(added);
  }));
  await prisma.employmentPreference.create({
    data: {
      lenderId: lender.id,
      employmentTypeId: employmentTypes[0].id,
    }
  });
  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
