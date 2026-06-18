const EMPTY_VALUE_RE = /^(none|жоқ|—+)$/i;

function cleanMachineValue(value: string | undefined): string {
  return (value ?? "").trim();
}

export type HalalVisionMachineLines = {
  display: string;
  barcode: string | null;
  name: string | null;
  machineOnly: boolean;
};

/** Extracts AI protocol lines without ever returning protocol-only text as user copy. */
export function parseHalalVisionMachineLines(raw: string): HalalVisionMachineLines {
  const text = (raw ?? "").trim();
  if (!text) return { display: "", barcode: null, name: null, machineOnly: false };

  const barcodeMatch = text.match(/^\s*BARCODE:\s*(.+)$/im);
  const barcodeValue = cleanMachineValue(barcodeMatch?.[1]);
  const digits = barcodeValue.replace(/\D/g, "");
  const barcode = barcodeValue && !EMPTY_VALUE_RE.test(barcodeValue) && digits.length >= 8 && digits.length <= 14 ? digits : null;

  const nameMatch = text.match(/^\s*NAME:\s*(.+)$/im);
  const nameValue = cleanMachineValue(nameMatch?.[1]);
  const name = nameValue && !EMPTY_VALUE_RE.test(nameValue) ? nameValue.slice(0, 120) : null;

  const display = text
    .split(/\r?\n/)
    .filter((line) => !/^\s*BARCODE:\s*/i.test(line) && !/^\s*NAME:\s*/i.test(line))
    .join("\n")
    .trim();

  return {
    display,
    barcode,
    name,
    machineOnly: display.length === 0 && (barcodeMatch != null || nameMatch != null),
  };
}
