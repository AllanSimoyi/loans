interface Props {
  details: [string, string];
}
export function LabeledDetail(props: Props) {
  const {
    details: [label, detail],
  } = props;
  return (
    <div className="flex flex-col items-stretch">
      <span className="text-xs font-light text-stone-600">{label}</span>
      <span className="text-stone-600">{detail}</span>
    </div>
  );
}
