import type { UploadKycDocToolSet } from '~/hooks/useUploadKycDoc';

import { useEffect, useRef } from 'react';

import { KycDoc } from '~/models/application.validations';

import { useField } from './ActionContextProvider';
import { Card } from './Card';
import { CardHeading } from './CardHeading';
import { CardSection } from './CardSection';
import { InlineAlert } from './InlineAlert';
import { UploadImage } from './UploadImage';

interface Props {
  nationalIdKyc: UploadKycDocToolSet;
  proofOfResidenceKyc: UploadKycDocToolSet;
  paySlipKyc: UploadKycDocToolSet;
  letterFromEmployerKyc: UploadKycDocToolSet;
  bankStatementKyc: UploadKycDocToolSet;
}

export function UploadDocuments(props: Props) {
  const {
    nationalIdKyc,
    proofOfResidenceKyc,
    paySlipKyc,
    letterFromEmployerKyc,
    bankStatementKyc,
  } = props;
  const ref = useRef<HTMLDivElement>(null);
  const { error } = useField('kycDocs');

  useEffect(() => {
    if (error) {
      ref.current?.scrollIntoView();
    }
  }, [error]);

  return (
    <Card>
      <div ref={ref} />
      <CardHeading>5. Upload Documents</CardHeading>
      <CardSection noBottomBorder>
        {error && (
          <div className="flex flex-col items-stretch py-2">
            <InlineAlert>{error}</InlineAlert>
          </div>
        )}
        <div className="flex flex-col items-stretch gap-4">
          <UploadImage {...nationalIdKyc} identifier={KycDoc.NationalID} />
          <UploadImage
            {...proofOfResidenceKyc}
            identifier={KycDoc.ProofOfResidence}
          />
          <UploadImage {...paySlipKyc} identifier={KycDoc.PaySlip} />
          <UploadImage
            {...letterFromEmployerKyc}
            identifier={KycDoc.LetterFromEmployer}
          />
          <UploadImage
            {...bankStatementKyc}
            identifier={KycDoc.BankStatement}
          />
        </div>
      </CardSection>
    </Card>
  );
}
