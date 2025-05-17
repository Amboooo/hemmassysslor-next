export async function POST(req) {
  const body = await req.json();

  if (body.export_csv) {
    const csvContent = "name,completed_by,date\n" + body.date + ",Ambjörn,true\n";
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tasks-${body.date}.csv"`,
      },
    });
  }

  const tasks = [
    { id: 1, name: "Slänga sopor", avatar_number: 1, completed: false },
    { id: 2, name: "Dammsuga", avatar_number: 2, completed: false },
    { id: 3, name: "Diska", avatar_number: 3, completed: false },
    { id: 4, name: "Tvätta", avatar_number: 4, completed: false },
    { id: 5, name: "Laga mat", avatar_number: 5, completed: false },
  ];

  return new Response(JSON.stringify({ tasks }), {
    headers: { "Content-Type": "application/json" },
  });
}
