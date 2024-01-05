import { AlertTriangle } from 'tabler-icons-react';

interface Props {
  children: React.ReactNode | string | string[];
}

export function InlineAlert(props: Props) {
  const { children } = props;
  return (
    <div className="flex flex-row items-center justify-start space-x-4 rounded-md border-l-2 border-l-red-600 p-3">
      {typeof children === 'string' ? (
        <div className="flex flex-row items-center gap-2">
          <AlertTriangle className="text-red-500" />
          <span className="font-light text-red-500">{children}</span>
        </div>
      ) : null}
      {children instanceof Array ? (
        <div className="flex flex-col items-start gap-2">
          {children.map((child, index) => (
            <span key={index} className="font-light text-red-500">
              {child || "Please ensure you've provided valid input"}
            </span>
          ))}
        </div>
      ) : null}
      {typeof children !== 'string' && !(children instanceof Array)
        ? children
        : null}
    </div>
  );
}
