/** Parse `EMP-001`, `emp-12`, or plain `3` → numeric sequence for next employee_no. */
export function parseEmployeeNumberSequence(employeeNo: string): number | null {
  const trimmed = employeeNo.trim();
  if (!trimmed) return null;

  const empMatch = trimmed.match(/^EMP-(\d+)$/i);
  if (empMatch) return Number.parseInt(empMatch[1]!, 10);

  if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);

  return null;
}

export function formatEmployeeNumber(sequence: number): string {
  return `EMP-${String(sequence).padStart(3, '0')}`;
}
