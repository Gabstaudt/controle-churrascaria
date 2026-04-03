import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

type Props = {
  value: string;
  className?: string;
};

export default function BarcodeLabel({ value, className }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      displayValue: false,
      height: 48,
      margin: 0,
      width: 1.6,
    });
  }, [value]);

  return <svg ref={svgRef} className={className} />;
}
