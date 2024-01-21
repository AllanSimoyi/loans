// import type { LoaderFunctionArgs, type ActionArgs } from '@remix-run/node';

// import {
//   Form,
//   json,
//   redirect,
//   useActionData,
//   useLoaderData,
//   useNavigation,
// } from '@remix-run/react';
// import { z } from 'zod';

// import { ActionContextProvider } from '~/components/ActionContextProvider';
// import { Card } from '~/components/Card';
// import { CenteredView } from '~/components/CenteredView';
// import { InlineAlert } from '~/components/InlineAlert';
// import { LoanDetails } from '~/components/LoanDetails';
// import { PersonalDetails } from '~/components/PersonalDetails';
// import { Toolbar } from '~/components/Toolbar';
// import { prisma } from '~/db.server';
// import { createApplication } from '~/models/application.server';
// import {
//   KycDoc,
//   TransformedCreateApplicationSchema,
// } from '~/models/application.validations';
// import { UserType } from '~/models/auth.validations';
// import {
//   StatusCode,
//   badRequest,
//   getQueryParams,
//   processBadRequest,
// } from '~/models/core.validations';
// import { getErrorMessage } from '~/models/errors';
// import { getRawFormFields } from '~/models/forms';
// import { AppLinks } from '~/models/links';
// import { createApplicant } from '~/models/user.server';
// import { createUserSession, getUser } from '~/session.server';
// import { useOptionalUser } from '~/utils';

// export async function loader({ request }: LoaderFunctionArgs) {
//   const currentUser = await getUser(request);
//   if (currentUser?.kind !== UserType.Applicant) {
//     throw new Response(
//       `${currentUser?.kind.toLowerCase()} users can't apply for loans`,
//       { status: StatusCode.Unauthorised },
//     );
//   }

//   const queryParams = getQueryParams(request.url, ['selectedLenderId']);
//   const result = z.coerce
//     .number()
//     .optional()
//     .safeParse(queryParams.selectedLenderId);
//   if (!result.success) {
//     throw new Response(
//       'Received an invalid lender ID, please reselect a lender',
//       { status: StatusCode.BadRequest },
//     );
//   }
//   const selectedLenderId = result.data;

//   const lenders = await prisma.lender.findMany({
//     select: { id: true, user: { select: { fullName: true } } },
//     where: { deactivated: false },
//   });
//   const selectedLender = lenders.find(
//     (lender) => lender.id === selectedLenderId,
//   );
//   if (selectedLenderId && !selectedLender) {
//     throw new Response('Lender record not found, please reselect a lender', {
//       status: StatusCode.NotFound,
//     });
//   }

//   return json({ lenders, selectedLender });
// }

// export async function action({ request }: ActionArgs) {
//   const currentUser = await getUser(request);

//   try {
//     const fields = await getRawFormFields(request);
//     const result = TransformedCreateApplicationSchema.safeParse(fields);
//     if (!result.success) {
//       return processBadRequest(result.error, fields);
//     }
//     const input = result.data;

//     if (currentUser) {
//       await createApplication({ ...input, applicantId: currentUser.id });
//       return redirect(AppLinks.Applications);
//     }

//     const missing = [KycDoc.NationalID, KycDoc.ProofOfResidence, KycDoc.PaySlip]
//       .map((label) => ({
//         label,
//         doc: input.kycDocs.find((kycDoc) => kycDoc.label === label),
//       }))
//       .filter(({ doc }) => !doc);

//     if (missing.length) {
//       return badRequest({
//         fieldErrors: {
//           kycDocs: [`Missing: ${missing.map((doc) => doc.label).join(', ')}`],
//         },
//       });
//     }

//     const { id: applicantId } = await createApplicant({
//       fullName: input.fullName,
//       emailAddress: input.emailAddress || '',
//       password: input.password || '',
//       passwordConfirmation: input.passwordConfirmation || '',
//     });

//     await createApplication({ ...input, applicantId });

//     return createUserSession({
//       request,
//       userId: applicantId,
//       remember: true,
//       redirectTo: AppLinks.Applications,
//     });
//   } catch (error) {
//     return badRequest({ formError: getErrorMessage(error) });
//   }
// }

// export default function Apply() {
//   const user = useOptionalUser();
//   const { lenders, selectedLender } = useLoaderData<typeof loader>();
//   const actionData = useActionData<typeof action>();

//   const nav = useNavigation();
//   const isProcessing = nav.formMethod === 'post';

//   return (
//     <div className="flex flex-col items-stretch">
//       <Toolbar currentUser={user} />
//       <CenteredView>
//         <CenteredView>
//           <CenteredView>
//             <div className="flex flex-col items-stretch gap-4 px-4 py-8">
//               {actionData?.formError && (
//                 <InlineAlert>{actionData.formError}</InlineAlert>
//               )}
//               <Card>
//                 <div className="flex flex-col justify-center items-center">
//                   <span>{selectedLender?.user.fullName || ''}</span>
//                   <span>Apply For Loan</span>
//                 </div>
//               </Card>
//               <Form method="post" className="flex flex-col items-stretch">
//                 <ActionContextProvider
//                   {...actionData}
//                   fields={actionData?.fields}
//                   isSubmitting={isProcessing}
//                 >
//                   <input
//                     type="hidden"
//                     name="applicationId"
//                     value={applicationId || 0}
//                   />
//                   <PersonalDetails actionData={actionData} />
//                   <LoanDetails lenders={lenders || []} />
//                   <BankDetails />
//                   <WorkDetails />
//                   <input
//                     type="hidden"
//                     name="kycDocs"
//                     value={JSON.stringify(
//                       kycDocs.filter((doc) => doc.publicId),
//                     )}
//                   />
//                   <UploadDocuments
//                     nationalIdKyc={nationalIdKyc}
//                     proofOfResidenceKyc={proofOfResidenceKyc}
//                     paySlipKyc={paySlipKyc}
//                     letterFromEmployerKyc={letterFromEmployerKyc}
//                     bankStatementKyc={bankStatementKyc}
//                   />
//                   <NextOfKinDetails />
//                   <PriorLoanDetails isOpen={hasPriorLoan} />
//                   {!isSignedIn && <Credentials />}
//                   <VStack align="center">
//                     <ScrollAnimation
//                       variants={getSlideUpScrollVariants({ delay: 0 })}
//                     >
//                       <PrimaryButton
//                         type="submit"
//                         isDisabled={isSubmitting || false}
//                       >
//                         {applicationId
//                           ? isSubmitting
//                             ? 'Updating...'
//                             : 'Update Application'
//                           : isSubmitting
//                           ? 'Submitting...'
//                           : 'Submit Application'}
//                       </PrimaryButton>
//                     </ScrollAnimation>
//                   </VStack>
//                 </ActionContextProvider>
//               </Form>
//             </div>
//           </CenteredView>
//         </CenteredView>
//       </CenteredView>
//     </div>
//   );
// }
