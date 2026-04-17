import { useState, useEffect } from "react";

const STORAGE_KEY = "halogen_tasks";

const TRACKING_OPTIONS = [
  "Halo-trackable",
  "Halo-untrackable",
  "Vendor-trackable",
  "Vendor-untrackable",
  "Not on tracker",
  "Personal only",
  "Halo-trackable/Halo-untrackable",
];

function getNow() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getWeek(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
}

function getMonth(dateStr) {
  return new Date(dateStr).toLocaleString("default", { month: "long" });
}

export default function CommanderApp() {
  const [screen, setScreen] = useState("home"); // home | newTask | activeTask | history
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [form, setForm] = useState({
    date: getToday(),
    region: "",
    client: "",
    vehicleNumber: "",
    trackingStatus: "",
    timeOfPickup: "",
    commanderName: "",
    pilotDriver: "",
  });
  const [legForm, setLegForm] = useState({ departurePoint: "", arrivalPoint: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const result = await window.storage.get(STORAGE_KEY, true);
      if (result) setTasks(JSON.parse(result.value));
    } catch {}
  }

  async function saveTasks(updated) {
    setTasks(updated);
    await window.storage.set(STORAGE_KEY, JSON.stringify(updated), true);
  }

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  }

  async function handleStartTask() {
    if (!form.commanderName || !form.client || !form.vehicleNumber || !form.region) {
      flash("Please fill in all required fields.");
      return;
    }
    const task = {
      id: Date.now().toString(),
      ...form,
      week: getWeek(form.date),
      month: getMonth(form.date),
      legs: [],
      finalDestination: "",
      completionTime: "",
      status: "Ongoing",
      createdAt: new Date().toISOString(),
    };
    const updated = [task, ...tasks];
    await saveTasks(updated);
    setActiveTask(task);
    setScreen("activeTask");
    flash("Task started!");
  }

  async function handleAddLeg(type) {
    if (!activeTask) return;
    const time = getNow();
    let updatedLegs = [...activeTask.legs];

    if (type === "depart") {
      if (!legForm.departurePoint) { flash("Enter departure point."); return; }
      updatedLegs.push({ departurePoint: legForm.departurePoint, timeDeparted: time, arrivalPoint: "", timeArrived: "" });
      setLegForm(f => ({ ...f, departurePoint: "" }));
      flash(`Departed at ${time}`);
    } else {
      if (!legForm.arrivalPoint) { flash("Enter arrival point."); return; }
      const lastLeg = updatedLegs[updatedLegs.length - 1];
      if (lastLeg && !lastLeg.timeArrived) {
        updatedLegs[updatedLegs.length - 1] = { ...lastLeg, arrivalPoint: legForm.arrivalPoint, timeArrived: time };
      } else {
        updatedLegs.push({ departurePoint: "", timeDeparted: "", arrivalPoint: legForm.arrivalPoint, timeArrived: time });
      }
      setLegForm(f => ({ ...f, arrivalPoint: "" }));
      flash(`Arrived at ${time}`);
    }

    const updated = { ...activeTask, legs: updatedLegs };
    setActiveTask(updated);
    const all = tasks.map(t => t.id === updated.id ? updated : t);
    await saveTasks(all);
  }

  async function handleComplete() {
    if (!activeTask) return;
    const time = getNow();
    const lastLeg = activeTask.legs[activeTask.legs.length - 1];
    const finalDest = lastLeg?.arrivalPoint || "—";
    const updated = { ...activeTask, finalDestination: finalDest, completionTime: time, status: "Completed" };
    setActiveTask(updated);
    const all = tasks.map(t => t.id === updated.id ? updated : t);
    await saveTasks(all);
    flash("Task marked as Completed!");
  }

  const myTasks = tasks.filter(t => t.commanderName === form.commanderName);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0f1e 0%, #0d1a2e 60%, #0a1520 100%)",
      fontFamily: "'Rajdhani', 'Oswald', sans-serif",
      color: "#e2e8f0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #f59e0b; border-radius: 2px; }
        input, select { outline: none; }
        input::placeholder { color: #4a5568; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "rgba(245,158,11,0.08)",
        borderBottom: "1px solid rgba(245,158,11,0.25)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "#0a0f1e",
          }}>H</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: "#f59e0b" }}>HALOGEN</div>
            <div style={{ fontSize: 10, color: "#718096", letterSpacing: 3 }}>COMMANDER FIELD APP</div>
          </div>
        </div>
        <div style={{
          fontSize: 11, color: "#718096", fontFamily: "'Share Tech Mono'",
          background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: 4,
          border: "1px solid #1a2744",
        }}>
          {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{
          background: "rgba(245,158,11,0.15)", border: "1px solid #f59e0b",
          padding: "10px 20px", textAlign: "center", fontSize: 13, color: "#fcd34d",
          letterSpacing: 1,
        }}>{msg}</div>
      )}

      {/* Nav */}
      <div style={{
        display: "flex", borderBottom: "1px solid #1a2744",
        background: "rgba(0,0,0,0.2)",
      }}>
        {["home", "newTask", "activeTask", "history"].map(s => (
          <button key={s} onClick={() => setScreen(s)} style={{
            flex: 1, padding: "12px 4px", background: screen === s ? "rgba(245,158,11,0.12)" : "transparent",
            border: "none", borderBottom: screen === s ? "2px solid #f59e0b" : "2px solid transparent",
            color: screen === s ? "#f59e0b" : "#4a5568", fontSize: 10,
            letterSpacing: 1.5, cursor: "pointer", fontFamily: "'Rajdhani'", fontWeight: 600,
            transition: "all 0.2s",
          }}>
            {s === "home" ? "HOME" : s === "newTask" ? "NEW TASK" : s === "activeTask" ? "ACTIVE" : "HISTORY"}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 480, margin: "0 auto" }}>

        {/* HOME */}
        {screen === "home" && (
          <div>
            <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px",
                background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))",
                border: "2px solid rgba(245,158,11,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32,
              }}>🛡️</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, color: "#f59e0b" }}>JOURNEY MANAGEMENT</div>
              <div style={{ fontSize: 13, color: "#4a5568", marginTop: 6, letterSpacing: 1 }}>Halogen Security · Field Operations</div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid #1a2744",
                borderRadius: 12, padding: "16px",
              }}>
                <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: 2, marginBottom: 12 }}>QUICK COMMANDER ID</div>
                <input
                  value={form.commanderName}
                  onChange={e => setForm(f => ({ ...f, commanderName: e.target.value }))}
                  placeholder="Enter your name to get started..."
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              {[
                { label: "Start New Task", icon: "🚀", action: () => setScreen("newTask"), highlight: true },
                { label: "Active Task", icon: "📡", action: () => setScreen("activeTask") },
                { label: "Task History", icon: "📋", action: () => setScreen("history") },
                { label: "Total Ops", icon: "📊", action: null, stat: tasks.length },
              ].map((item, i) => (
                <div key={i} onClick={item.action} style={{
                  background: item.highlight ? "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))" : "rgba(255,255,255,0.03)",
                  border: item.highlight ? "1px solid rgba(245,158,11,0.5)" : "1px solid #1a2744",
                  borderRadius: 12, padding: "20px 16px", cursor: item.action ? "pointer" : "default",
                  textAlign: "center", transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: item.highlight ? "#f59e0b" : "#a0aec0" }}>
                    {item.stat !== undefined ? item.stat : item.label}
                  </div>
                  {item.stat !== undefined && <div style={{ fontSize: 10, color: "#4a5568", marginTop: 2 }}>{item.label}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW TASK */}
        {screen === "newTask" && (
          <div>
            <SectionTitle>📋 NEW TASK BRIEFING</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FieldGroup label="DATE OF TASK">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </FieldGroup>
              <FieldGroup label="REGION *">
                <input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="e.g. Lagos, Abuja, Port Harcourt..." style={inputStyle} />
              </FieldGroup>
              <FieldGroup label="CLIENT / TASK *">
                <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Client name or task description..." style={inputStyle} />
              </FieldGroup>
              <FieldGroup label="VEHICLE NUMBER *">
                <input value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} placeholder="e.g. LAG-234-XY" style={inputStyle} />
              </FieldGroup>
              <FieldGroup label="TRACKING STATUS">
                <select value={form.trackingStatus} onChange={e => setForm(f => ({ ...f, trackingStatus: e.target.value }))} style={inputStyle}>
                  <option value="">Select tracking status...</option>
                  {TRACKING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="TIME OF PICKUP">
                <input type="time" value={form.timeOfPickup} onChange={e => setForm(f => ({ ...f, timeOfPickup: e.target.value }))} style={inputStyle} />
              </FieldGroup>
              <FieldGroup label="COMMANDER NAME *">
                <input value={form.commanderName} onChange={e => setForm(f => ({ ...f, commanderName: e.target.value }))} placeholder="Commander's full name..." style={inputStyle} />
              </FieldGroup>
              <FieldGroup label="PILOT / DRIVER">
                <input value={form.pilotDriver} onChange={e => setForm(f => ({ ...f, pilotDriver: e.target.value }))} placeholder="Driver's name..." style={inputStyle} />
              </FieldGroup>

              <button onClick={handleStartTask} style={primaryBtn}>
                🚀 INITIATE TASK
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE TASK */}
        {screen === "activeTask" && (
          <div>
            <SectionTitle>📡 ACTIVE TASK — SITREP</SectionTitle>
            {!activeTask ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#4a5568" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
                <div style={{ fontSize: 14 }}>No active task. Start a new task first.</div>
              </div>
            ) : (
              <div>
                {/* Task summary card */}
                <div style={{
                  background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 12, padding: 16, marginBottom: 20,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b", letterSpacing: 1 }}>{activeTask.client}</div>
                    <StatusBadge status={activeTask.status} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      ["Commander", activeTask.commanderName],
                      ["Vehicle", activeTask.vehicleNumber],
                      ["Region", activeTask.region],
                      ["Pickup", activeTask.timeOfPickup || "—"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 9, color: "#4a5568", letterSpacing: 1.5 }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Movement log */}
                {activeTask.legs.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: 2, marginBottom: 10 }}>MOVEMENT LOG</div>
                    {activeTask.legs.map((leg, i) => (
                      <div key={i} style={{
                        borderLeft: "2px solid rgba(245,158,11,0.3)",
                        paddingLeft: 14, marginBottom: 14, position: "relative",
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: "#f59e0b", position: "absolute", left: -5, top: 4,
                        }} />
                        {leg.departurePoint && (
                          <div style={{ fontSize: 12, color: "#a0aec0", marginBottom: 2 }}>
                            <span style={{ color: "#ef4444" }}>↑ DEP</span> {leg.departurePoint}
                            {leg.timeDeparted && <span style={{ color: "#4a5568", fontFamily: "'Share Tech Mono'", marginLeft: 6 }}>{leg.timeDeparted}</span>}
                          </div>
                        )}
                        {leg.arrivalPoint && (
                          <div style={{ fontSize: 12, color: "#a0aec0" }}>
                            <span style={{ color: "#22c55e" }}>↓ ARR</span> {leg.arrivalPoint}
                            {leg.timeArrived && <span style={{ color: "#4a5568", fontFamily: "'Share Tech Mono'", marginLeft: 6 }}>{leg.timeArrived}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* SITREP buttons */}
                {activeTask.status === "Ongoing" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: 2, marginBottom: 4 }}>UPDATE SITUATION REPORT</div>

                    <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 11, color: "#ef4444", letterSpacing: 1.5, marginBottom: 8 }}>DEPARTING FROM</div>
                      <input
                        value={legForm.departurePoint}
                        onChange={e => setLegForm(f => ({ ...f, departurePoint: e.target.value }))}
                        placeholder="Current departure location..."
                        style={inputStyle}
                      />
                      <button onClick={() => handleAddLeg("depart")} style={{
                        ...primaryBtn, background: "linear-gradient(135deg, #ef4444, #dc2626)", marginTop: 10,
                      }}>
                        ↑ LOG DEPARTURE — {getNow()}
                      </button>
                    </div>

                    <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 11, color: "#22c55e", letterSpacing: 1.5, marginBottom: 8 }}>ARRIVING AT</div>
                      <input
                        value={legForm.arrivalPoint}
                        onChange={e => setLegForm(f => ({ ...f, arrivalPoint: e.target.value }))}
                        placeholder="Current arrival location..."
                        style={inputStyle}
                      />
                      <button onClick={() => handleAddLeg("arrive")} style={{
                        ...primaryBtn, background: "linear-gradient(135deg, #22c55e, #16a34a)", marginTop: 10,
                      }}>
                        ↓ LOG ARRIVAL — {getNow()}
                      </button>
                    </div>

                    <button onClick={handleComplete} style={{
                      ...primaryBtn,
                      background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
                      border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b",
                      marginTop: 8,
                    }}>
                      ✅ MARK TASK COMPLETE
                    </button>
                  </div>
                )}

                {activeTask.status === "Completed" && (
                  <div style={{
                    textAlign: "center", padding: "24px",
                    background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.3)",
                    borderRadius: 12,
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>TASK COMPLETED</div>
                    <div style={{ color: "#4a5568", fontSize: 12, marginTop: 4 }}>Completion time: {activeTask.completionTime}</div>
                    <div style={{ color: "#4a5568", fontSize: 12 }}>Final destination: {activeTask.finalDestination}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {screen === "history" && (
          <div>
            <SectionTitle>📋 TASK HISTORY</SectionTitle>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#4a5568" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div>No tasks recorded yet.</div>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid #1a2744",
                  borderRadius: 10, padding: 14, marginBottom: 10,
                  borderLeft: `3px solid ${task.status === "Completed" ? "#22c55e" : "#f59e0b"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{task.client}</div>
                    <StatusBadge status={task.status} />
                  </div>
                  <div style={{ fontSize: 11, color: "#4a5568", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>📅 {task.date}</span>
                    <span>👤 {task.commanderName}</span>
                    <span>🚗 {task.vehicleNumber}</span>
                    <span>📍 {task.region}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#4a5568", marginTop: 4 }}>
                    {task.legs.length} movement{task.legs.length !== 1 ? "s" : ""} logged
                    {task.completionTime && ` · Completed ${task.completionTime}`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#f59e0b",
      marginBottom: 16, paddingBottom: 8,
      borderBottom: "1px solid rgba(245,158,11,0.2)",
    }}>{children}</div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#718096", letterSpacing: 2, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const isComplete = status === "Completed";
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
      padding: "3px 8px", borderRadius: 4,
      background: isComplete ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
      color: isComplete ? "#22c55e" : "#f59e0b",
      border: `1px solid ${isComplete ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
    }}>{status?.toUpperCase()}</div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid #1e2d47",
  borderRadius: 8, color: "#e2e8f0", fontSize: 14,
  fontFamily: "'Rajdhani', sans-serif", fontWeight: 500,
};

const primaryBtn = {
  width: "100%", padding: "13px",
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  border: "none", borderRadius: 8,
  color: "#0a0f1e", fontSize: 13, fontWeight: 700, letterSpacing: 2,
  cursor: "pointer", fontFamily: "'Rajdhani', sans-serif",
};
