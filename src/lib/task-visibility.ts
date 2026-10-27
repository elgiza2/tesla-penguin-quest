export function pendingTasks<T extends { id: string }>(tasks: T[], completed: string[]): T[] {
  const done = new Set(completed);
  return tasks.filter(task => !done.has(task.id));
}