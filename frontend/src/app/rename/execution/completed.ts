export function completed(status: string): boolean {
  return status === 'done' || status === 'unchanged';
}
