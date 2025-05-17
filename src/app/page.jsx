"use client";
import React, { useState, useEffect } from "react";


function MainComponent() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnimation, setShowAnimation] = useState(true);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // Load tasks for the selected date
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

  // Hide animation after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate weekly stats
  useEffect(() => {
    if (showStats) {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const labels = [];
      const ambjornData = [];
      const saraData = [];

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(currentDate.getDate() + i);
        labels.push(
          currentDate.toLocaleDateString("sv-SE", { weekday: "short" })
        );

        const dayTasks = tasks.filter((t) => t.completed);
        const ambjornCompleted = dayTasks.filter(
          (t) => t.completed_by === "Ambjörn"
        ).length;
        const saraCompleted = dayTasks.filter(
          (t) => t.completed_by === "Sara"
        ).length;

        ambjornData.push((ambjornCompleted / tasks.length) * 100);
        saraData.push((saraCompleted / tasks.length) * 100);
      }

      setStatsData({
        labels,
        datasets: [
          {
            label: "Ambjörn",
            data: ambjornData,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
          {
            label: "Sara",
            data: saraData,
            borderColor: "rgb(255, 99, 132)",
            tension: 0.1,
          },
        ],
      });
    }
  }, [showStats, date, tasks]);

  const generateBackground = async () => {
    try {
      const response = await fetch(
        `/integrations/dall-e-3/?prompt=${encodeURIComponent(backgroundPrompt)}`
      );
      if (!response.ok) throw new Error("Failed to generate background");
      const data = await response.json();
      setBackgroundImage(data.data[0]);
    } catch (err) {
      console.error(err);
      setError("Could not generate background image");
    }
  };

  const toggleTask = async (taskId, person, day) => {
    const task = tasks.find((t) => t.id === taskId);
    let newStatus = false;
    let isBeast = person === "beast";

    // Om det är samma person och samma dag som redan är ikryssad, avmarkera
    if (task.completions && task.completions[day]) {
      const dayCompletion = task.completions[day];
      if (isBeast) {
        newStatus = !dayCompletion.beast_completed;
      } else {
        newStatus =
          dayCompletion.completed_by === person
            ? !dayCompletion.completed
            : true;
      }
    } else {
      newStatus = true;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          completed: newStatus,
          completed_by: person,
          date: day,
          beast_completed: isBeast ? newStatus : undefined,
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

  const daysOfWeek = [
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lördag",
    "Söndag",
  ];

  return (
    <div
      className="min-h-screen p-4"
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      <div className="max-w-6xl mx-auto bg-white/90 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Hemmafix</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            value={backgroundPrompt}
            onChange={(e) => setBackgroundPrompt(e.target.value)}
            placeholder="Skriv en prompt för bakgrundsbild..."
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={generateBackground}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Generera bakgrund
          </button>
        </div>

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
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            {showStats ? "Dölj statistik" : "Visa statistik"}
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
                <th className="px-4 py-2 border-b-2">Syssla</th>
                {daysOfWeek.map((day) => (
                  <th key={day} className="px-4 py-2 border-b-2">
                    <div className="text-center">{day}</div>
                    <div className="flex justify-center gap-4 mt-2">
                      <div className="text-center">
                        <img
                          src="superman.png"
                          alt="Ambjörn"
                          className="inline-block w-8 h-8"
                        />
                      </div>
                      <div className="text-center">
                        <img
                          src="belle.png"
                          alt="Sara"
                          className="inline-block w-8 h-8"
                        />
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2 border-b-2">
                  <div className="text-center">Beast</div>
                  <div className="flex justify-center mt-2">
                    <div className="text-center">
                      <img
                        src="beast.png"
                        alt="Beast"
                        className="inline-block w-8 h-8"
                      />
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{task.icon}</span>
                      {task.name}
                    </div>
                  </td>
                  {daysOfWeek.map((day) => {
                    const dayCompletion =
                      task.completions && task.completions[day];
                    return (
                      <td key={`${task.id}-${day}`} className="px-4 py-2">
                        <div className="flex justify-center gap-4">
                          <input
                            type="checkbox"
                            checked={
                              dayCompletion?.completed &&
                              dayCompletion?.completed_by === "Ambjörn"
                            }
                            onChange={() => toggleTask(task.id, "Ambjörn", day)}
                            className="w-6 h-6"
                          />
                          <input
                            type="checkbox"
                            checked={
                              dayCompletion?.completed &&
                              dayCompletion?.completed_by === "Sara"
                            }
                            onChange={() => toggleTask(task.id, "Sara", day)}
                            className="w-6 h-6"
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={task.beast_completed}
                        onChange={() => toggleTask(task.id, "beast", date)}
                        className="w-6 h-6"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showStats && statsData && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Veckans statistik</h2>
            <canvas
              id="statsChart"
              width="400"
              height="200"
              data-chart={JSON.stringify(statsData)}
            />
          </div>
        )}
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