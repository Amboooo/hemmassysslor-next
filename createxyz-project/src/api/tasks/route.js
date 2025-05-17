async function handler({ date, task_id, completed, completed_by, export_csv }) {
  if (!date) {
    date = new Date().toISOString().split("T")[0];
  }

  // 🔁 Rensa dubbletter baserat på namn
  await sql(`
  DELETE FROM tasks
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) as row_num
      FROM tasks
    ) t
    WHERE t.row_num > 1
  );
`);

  if (task_id && completed_by) {
    await sql(
      "INSERT INTO task_completions (task_id, date, completed_by, completed) VALUES ($1, $2, $3, $4) ON CONFLICT (task_id, date, completed_by) DO UPDATE SET completed = $5",
      [task_id, date, completed_by, completed, completed]
    );
  }

  const tasks = await sql(
    "SELECT t.id, t.name, t.avatar_number, COALESCE(tc.completed, false) as completed, COALESCE(tc.completed_by, '') as completed_by FROM tasks t LEFT JOIN task_completions tc ON t.id = tc.task_id AND tc.date = $1 ORDER BY t.id",
    [date]
  );

  if (export_csv) {
    const csvRows = ["Task Name,Avatar Number,Completed,Completed By"];
    tasks.forEach((task) => {
      csvRows.push(
        `${task.name},${task.avatar_number},${task.completed},${task.completed_by}`
      );
    });
    return {
      csv: csvRows.join("\n"),
      contentType: "text/csv",
      filename: `tasks-${date}.csv`,
    };
  }

  return { tasks };
}

export async function POST(request) {
  return handler(await request.json());
}