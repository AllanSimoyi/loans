import type {
  TransformedCreateApplicationSchema,
  TransformedEditApplicationSchema,
} from './application.validations';
import type { z } from 'zod';

import { prisma } from '~/db.server';

import { ApplicationState } from './application.validations';

interface CreateApplicationProps
  extends z.infer<typeof TransformedCreateApplicationSchema> {
  applicantId: number;
}
export function createApplication(props: CreateApplicationProps) {
  const { kycDocs, selectedLenderId } = props;
  return prisma.application.create({
    data: {
      applicantId: props.applicantId,
      state: ApplicationState.Pending,
      moreDetail: props.moreDetail,

      bank: props.bank,
      bankBranch: props.bankBranch,
      accNumber: props.accNumber,
      accName: props.accName,

      loanPurpose: props.loanPurpose,
      amtRequired: props.amtRequired,
      repaymentPeriod: props.repaymentPeriod,

      title: props.title,
      fullName: props.fullName,
      DOB: props.DOB,
      nationalID: props.nationalID,
      phoneNumber: props.phoneNumber,
      resAddress: props.resAddress,
      natureOfRes: props.natureOfRes,

      fullMaidenNames: props.fullMaidenNames,
      fullNameOfSpouse: props.fullNameOfSpouse,
      maritalStatus: props.maritalStatus,

      profession: props.profession,
      employer: props.employer,
      employedSince: props.employedSince,
      grossIncome: props.grossIncome,
      netIncome: props.netIncome,

      firstNokFullName: props.firstNokFullName,
      firstNokRelationship: props.firstNokRelationship,
      firstNokEmployer: props.firstNokEmployer,
      firstNokResAddress: props.firstNokResAddress,
      firstNokPhoneNumber: props.firstNokPhoneNumber,

      secondNokFullName: props.secondNokFullName,
      secondNokRelationship: props.secondNokRelationship,
      secondNokEmployer: props.secondNokEmployer,
      secondNokResAddress: props.secondNokResAddress,
      secondNokPhoneNumber: props.secondNokPhoneNumber,

      kycDocs: {
        createMany: {
          data: kycDocs.map(({ label, publicId }) => ({
            label,
            publicId,
          })),
        },
      },
      channels: {
        createMany: { data: [{ lenderId: selectedLenderId }] },
      },
      priorLoans: props.priorLoan
        ? { createMany: { data: [props.priorLoan] } }
        : undefined,
    },
  });
}

interface EditApplicationProps
  extends z.infer<typeof TransformedEditApplicationSchema> {}
export function editApplication(props: EditApplicationProps) {
  const { applicationId, kycDocs, selectedLenderId } = props;
  return prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: {
        moreDetail: props.moreDetail,

        bank: props.bank,
        bankBranch: props.bankBranch,
        accNumber: props.accNumber,
        accName: props.accName,

        loanPurpose: props.loanPurpose,
        amtRequired: props.amtRequired,
        repaymentPeriod: props.repaymentPeriod,

        title: props.title,
        fullName: props.fullName,
        DOB: props.DOB,
        nationalID: props.nationalID,
        phoneNumber: props.phoneNumber,
        resAddress: props.resAddress,
        natureOfRes: props.natureOfRes,

        fullMaidenNames: props.fullMaidenNames,
        fullNameOfSpouse: props.fullNameOfSpouse,
        maritalStatus: props.maritalStatus,

        profession: props.profession,
        employer: props.employer,
        employedSince: props.employedSince,
        grossIncome: props.grossIncome,
        netIncome: props.netIncome,

        firstNokFullName: props.firstNokFullName,
        firstNokRelationship: props.firstNokRelationship,
        firstNokEmployer: props.firstNokEmployer,
        firstNokResAddress: props.firstNokResAddress,
        firstNokPhoneNumber: props.firstNokPhoneNumber,

        secondNokFullName: props.secondNokFullName,
        secondNokRelationship: props.secondNokRelationship,
        secondNokEmployer: props.secondNokEmployer,
        secondNokResAddress: props.secondNokResAddress,
        secondNokPhoneNumber: props.secondNokPhoneNumber,
      },
    });
    const channel = tx.channel.findFirst({
      where: { lenderId: selectedLenderId },
    });
    if (!channel) {
      await tx.channel.create({
        data: {
          lenderId: selectedLenderId,
          applicationId,
        },
      });
    }
    await tx.kycDoc.deleteMany({
      where: { applicationId },
    });
    await tx.kycDoc.createMany({
      data: kycDocs.map(({ label, publicId }) => ({
        applicationId,
        label,
        publicId,
      })),
    });
    if (!props.priorLoan) {
      await tx.priorLoan.deleteMany({
        where: { applicationId },
      });
    } else {
      const priorLoan = await tx.priorLoan.findFirst({
        where: { applicationId },
      });
      if (priorLoan) {
        await tx.priorLoan.update({
          where: { id: priorLoan.id },
          data: { ...props.priorLoan },
        });
      } else {
        tx.priorLoan.create({
          data: {
            ...props.priorLoan,
            applicationId,
          },
        });
      }
    }
  });
}
