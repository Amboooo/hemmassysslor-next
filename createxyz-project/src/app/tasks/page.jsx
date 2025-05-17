"use client";
import React from "react";

function MainComponent() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
        if (!response.ok) throw new Error("Failed to load tasks");
        const data = await response.json();
        setTasks(data.tasks);
      } catch (err) {
        console.error(err);
        setError("Could not load tasks");
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [date]);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const toggleTask = async (taskId, person) => {
    const task = tasks.find((t) => t.id === taskId);
    const newStatus = !task.completed;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          completed: newStatus,
          completed_by: person,
          date,
        }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      const data = await response.json();
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
      setError("Could not update task");
    }
  };

  const exportToCsv = async () => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, export_csv: true }),
      });
      if (!response.ok) throw new Error("Failed to export tasks");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-${date}.csv`;
      a.click();
    } catch (err) {
      console.error(err);
      setError("Could not export tasks");
    }
  };

  if (showAnimation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <img
          src="/belle-sweep-superman.gif"
          alt="Loading animation"
          className="max-w-full max-h-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white/90 p-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Hemmafix</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={exportToCsv}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Exportera CSV
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Syssla</th>
                <th className="px-4 py-2">
                  <img
                    src="/superman_32x32.png"
                    alt="Ambjörn"
                    className="inline-block mr-2"
                  />
                  Ambjörn
                </th>
                <th className="px-4 py-2">
                  <img
                    src="/belle_32x32.png"
                    alt="Sara"
                    className="inline-block mr-2"
                  />
                  Sara
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <img
                        src={`/avatar${task.avatar_number}.png`}
                        alt={task.name}
                        className="w-8 h-8 mr-2"
                      />
                      {task.name}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={
                        task.completed && task.completed_by === "Ambjörn"
                      }
                      onChange={() => toggleTask(task.id, "Ambjörn")}
                      className="w-6 h-6"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={task.completed && task.completed_by === "Sara"}
                      onChange={() => toggleTask(task.id, "Sara")}
                      className="w-6 h-6"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;