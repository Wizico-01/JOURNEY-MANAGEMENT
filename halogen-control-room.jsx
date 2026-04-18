import { useState, useEffect, useRef } from "react";

const B = {
  navy: "#0d1b3e",
  navyMid: "#0f1f47",
  navyCard: "#1a2d55",
  navyBorder: "#1e3464",
  gold: "#f0a500",
  goldLight: "#ffc233",
  goldDim: "#b87d00",
  goldGlow: "rgba(240,165,0,0.12)",
  offWhite: "#e8eaf0",
  muted: "#6b7fa8",
  mutedDark: "#3a4d72",
  danger: "#e05252",
  success: "#4caf82",
};

const TASKS_KEY = "halogen_tasks_v2";

function HalogenLogo({ size }) {
  const s = size || 40;
  const rays = 40;
  const r = s * 0.27;
  const cx = s / 2;
  const cy = s * 0.46;
  const lines = [];
  for (let i = 0; i < rays; i++) {
    const a = (-175 + (170 / (rays - 1)) * i) * (Math.PI / 180);
    const inner = r + s * 0.04;
    const outer = r + s * 0.35 + (Math.abs(i - rays / 2) < rays * 0.18 ? s * 0.06 : 0);
    lines.push(
      <line
        key={i}
        x1={cx + inner * Math.cos(a)}
        y1={cy + inner * Math.sin(a)}
        x2={cx + outer * Math.cos(a)}
        y2={cy + outer * Math.sin(a)}
        stroke="url(#hlg2)"
        strokeWidth={s * 0.009}
        strokeLinecap="round"
        opacity={0.92}
      />
    );
  }
  return (
    <svg width={s} height={s * 1.12} viewBox={`0 0 ${s} ${s * 1.12}`}>
      <defs>
        <radialGradient id="hlg2" cx="50%" cy="46%" r="55%">
          <stop offset="0%" stopColor={B.goldLight} />
          <stop offset="100%" stopColor={B.gold} />
        </radialGradient>
      </defs>
      {lines}
      <circle cx={cx} cy={cy} r={r} fill={B.navy} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={B.goldDim} strokeWidth={1.2} />
    </svg>
  );
}

function StatusBadge({ status }) {
  const ok = status === "Completed";
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1.5,
        padding: "3px 8px",
        borderRadius: 4,
        background: ok ? "rgba(76,175,130,0.15)" : "rgba(240,165,0,0.12)",
        color: ok ? B.success : B.gold,
        border: `1px solid ${ok ? "rgba(76,175,130,0.3)" : "rgba(240,165,0,0.3)"}`,
        fontFamily: "'Barlow'",
      }}
    >
      {ok ? "DONE" : "LIVE"}
    </span>
  );
}

function currentLocation(task) {
  const leg = task.legs && task.legs[task.legs.length - 1];
  if (!leg) return "Standby — no movement logged";
  if (leg.timeArrived) return "📍 " + leg.arrivalPoint;
  if (leg.timeDeparted) return "🚗 En route from " + leg.departurePoint;
  return "Standby";
}

export default function ControlRoomDashboard() {
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newAlert, setNewAlert] = useState(false);
  const prevLen = useRef(0);

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  async function load() {
    try {
      const r = await window.storage.get(TASKS_KEY, true);
      if (r) {
        const data = JSON.parse(r.value);
        if (data.length !== prevLen.current) {
          setNewAlert(true);
          setTimeout(() => setNewAlert(false), 2500);
          prevLen.current = data.length;
        }
        setTasks(data);
        setLastUpdated(new Date());
      }
    } catch {}
  }

  const ongoing = tasks.filter((t) => t.status === "Ongoing");
  const completed = tasks.filter((t) => t.status === "Completed");

  const filtered = tasks.filter((t) => {
    const matchFilter = filter === "all" || t.status.toLowerCase() === filter;
    const term = search.toLowerCase();
    const matchSearch =
      !search ||
      (t.client && t.client.toLowerCase().includes(term)) ||
      (t.commanderName && t.commanderName.toLowerCase().includes(term)) ||
      (t.vehicleNumber && t.vehicleNumber.toLowerCase().includes(term)) ||
      (t.region && t.region.toLowerCase().includes(term));
    return matchFilter && matchSearch;
  });

  const liveSelected = selected ? tasks.find((t) => t.id === selected.id) || selected : null;

  return (
    <div style={{ minHeight: "100vh", background: B.navy, fontFamily: "'Barlow', sans-serif", color: B.offWhite, fontSize: 12 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { outline: none; }
        input::placeholder { color: #3a4d72; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e3464; }
        .row:hover { background: rgba(240,165,0,0.04) !important; cursor: pointer; }
        @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        .slide-in { animation: slideIn 0.25s ease-out both; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .blink { animation: blink 1.4s infinite; }
        @keyframes alertFade { 0%{background:rgba(240,165,0,0.18)} 100%{background:transparent} }
        .alert-fade { animation: alertFade 2s ease-out; }
      `}</style>

      {/* Top Bar */}
      <div
        style={{
          background: B.navyMid,
          borderBottom: `1px solid ${B.navyBorder}`,
          padding: "0 24px",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <HalogenLogo size={42} />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: 4 }}>
              HALOGEN GROUP
            </div>
            <div style={{ fontSize: 9, color: B.gold, letterSpacing: 4 }}>CONTROL ROOM · JOURNEY MANAGEMENT SYSTEM</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              className="blink"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: ongoing.length > 0 ? B.success : B.mutedDark,
              }}
            />
            <span
              style={{
                fontFamily: "'Barlow'",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: ongoing.length > 0 ? B.success : B.mutedDark,
              }}
            >
              {ongoing.length} LIVE OPS
            </span>
          </div>
          <div style={{ fontSize: 10, color: B.mutedDark }}>
            SYNC {lastUpdated ? lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
          </div>
          <div style={{ fontSize: 10, color: B.mutedDark }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {newAlert && (
        <div
          className="alert-fade"
          style={{ padding: "7px 24px", textAlign: "center", fontSize: 11, color: B.gold, letterSpacing: 2, fontWeight: 700 }}
        >
          ⚡ FIELD UPDATE RECEIVED
        </div>
      )}

      {/* Stats Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          borderBottom: `1px solid ${B.navyBorder}`,
          background: "rgba(0,0,0,0.15)",
        }}
      >
        {[
          { label: "TOTAL TASKS", value: tasks.length, color: B.muted },
          { label: "ONGOING", value: ongoing.length, color: B.gold },
          { label: "COMPLETED", value: completed.length, color: B.success },
          { label: "COMMANDERS", value: [...new Set(tasks.map((t) => t.commanderName).filter(Boolean))].length, color: "#5b9bd5" },
          { label: "REGIONS", value: [...new Set(tasks.map((t) => t.region).filter(Boolean))].length, color: "#b07fd5" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              padding: "14px 20px",
              borderRight: i < 4 ? `1px solid ${B.navyBorder}` : "none",
            }}
          >
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 26, fontWeight: 800, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 9, color: B.mutedDark, letterSpacing: 2, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 150px)" }}>

        {/* Task List Panel */}
        <div
          style={{
            flex: liveSelected ? "0 0 55%" : 1,
            borderRight: `1px solid ${B.navyBorder}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Filters */}
          <div
            style={{
              padding: "10px 16px",
              borderBottom: `1px solid ${B.navyBorder}`,
              background: "rgba(0,0,0,0.1)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commander, client, vehicle, region..."
              style={{
                flex: 1,
                padding: "7px 12px",
                background: B.navyCard,
                border: `1px solid ${B.navyBorder}`,
                borderRadius: 6,
                color: B.offWhite,
                fontSize: 11,
                fontFamily: "'Barlow'",
              }}
            />
            {["all", "ongoing", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 12px",
                  background: filter === f ? B.goldGlow : "transparent",
                  border: `1px solid ${filter === f ? "rgba(240,165,0,0.4)" : B.navyBorder}`,
                  borderRadius: 5,
                  color: filter === f ? B.gold : B.mutedDark,
                  fontSize: 9,
                  letterSpacing: 1.5,
                  cursor: "pointer",
                  fontFamily: "'Barlow'",
                  fontWeight: 700,
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "90px 50px 1fr 130px 85px 70px 70px",
              padding: "7px 16px",
              background: "rgba(0,0,0,0.2)",
              borderBottom: `1px solid ${B.navyBorder}`,
              fontSize: 9,
              letterSpacing: 2,
              color: B.mutedDark,
              fontWeight: 700,
            }}
          >
            {["DATE", "WK", "CLIENT/TASK", "COMMANDER", "VEHICLE", "REGION", "STATUS"].map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>

          {/* Task Rows */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: B.mutedDark }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
                <div>No tasks found. Awaiting field reports.</div>
              </div>
            ) : (
              filtered.map((task) => (
                <div
                  key={task.id}
                  className="row"
                  onClick={() => setSelected(liveSelected && liveSelected.id === task.id ? null : task)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 50px 1fr 130px 85px 70px 70px",
                    padding: "10px 16px",
                    borderBottom: `1px solid rgba(18,32,64,0.8)`,
                    background: liveSelected && liveSelected.id === task.id ? "rgba(240,165,0,0.05)" : "transparent",
                    borderLeft: `2px solid ${task.status === "Completed" ? B.success : B.gold}`,
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ fontSize: 11, color: B.muted }}>{task.date}</div>
                  <div style={{ fontSize: 11, color: B.mutedDark }}>W{task.week}</div>
                  <div style={{ fontSize: 11, color: B.offWhite, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {task.client}
                  </div>
                  <div style={{ fontSize: 11, color: B.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {task.commanderName}
                  </div>
                  <div style={{ fontSize: 11, color: B.muted }}>{task.vehicleNumber}</div>
                  <div style={{ fontSize: 11, color: B.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {task.region}
                  </div>
                  <div>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {liveSelected && (
          <div
            className="slide-in"
            style={{ flex: "0 0 45%", overflowY: "auto", background: "#0a1530" }}
          >
            {/* Panel Header */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${B.navyBorder}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                background: "#0a1530",
                zIndex: 10,
              }}
            >
              <div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: "#fff", fontSize: 17 }}>
                  {liveSelected.client}
                </div>
                <div style={{ fontSize: 10, color: B.muted, marginTop: 2 }}>
                  {liveSelected.commanderName} · {liveSelected.region}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <StatusBadge status={liveSelected.status} />
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none",
                    border: `1px solid ${B.navyBorder}`,
                    color: B.muted,
                    borderRadius: 5,
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "'Barlow'",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: "16px 20px" }}>
              {/* Current location */}
              <div
                style={{
                  background: B.goldGlow,
                  border: "1px solid rgba(240,165,0,0.2)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 9, color: B.gold, letterSpacing: 2, marginBottom: 4 }}>CURRENT LOCATION</div>
                <div style={{ fontSize: 14, color: B.goldLight, fontWeight: 700 }}>{currentLocation(liveSelected)}</div>
              </div>

              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  ["Date", liveSelected.date],
                  ["Week", "Week " + liveSelected.week],
                  ["Month", liveSelected.month],
                  ["Region", liveSelected.region],
                  ["Commander", liveSelected.commanderName],
                  ["Driver/Pilot", liveSelected.pilotDriver || "—"],
                  ["Vehicle", liveSelected.vehicleNumber],
                  ["Pickup Time", liveSelected.timeOfPickup || "—"],
                  ["Tracking", liveSelected.trackingStatus || "—"],
                  ["Status", liveSelected.status],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      background: B.navyCard,
                      border: `1px solid ${B.navyBorder}`,
                      borderRadius: 7,
                      padding: "9px 12px",
                    }}
                  >
                    <div style={{ fontSize: 9, color: B.mutedDark, letterSpacing: 2, marginBottom: 3 }}>
                      {k.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, color: B.offWhite, fontWeight: 500, wordBreak: "break-all" }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Movement log */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: B.mutedDark, letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>
                  MOVEMENT LOG · {(liveSelected.legs && liveSelected.legs.length) || 0} LEGS
                </div>
                {(!liveSelected.legs || liveSelected.legs.length === 0) && (
                  <div style={{ color: B.mutedDark, fontSize: 11 }}>No movements logged yet.</div>
                )}
                {liveSelected.legs && liveSelected.legs.map((leg, i) => (
                  <div key={i} style={{ position: "relative", paddingLeft: 18, paddingBottom: 14 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: i === liveSelected.legs.length - 1 ? B.gold : B.navyBorder,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: -3,
                        top: 5,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: i === liveSelected.legs.length - 1 ? B.gold : B.navyBorder,
                      }}
                    />
                    <div
                      style={{
                        background: B.navyCard,
                        border: `1px solid ${B.navyBorder}`,
                        borderRadius: 7,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ fontSize: 9, color: B.mutedDark, marginBottom: 5 }}>LEG {i + 1}</div>
                      {leg.departurePoint && (
                        <div style={{ fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: B.danger }}>↑ DEP </span>
                          <span style={{ color: B.offWhite }}>{leg.departurePoint}</span>
                          {leg.timeDeparted && (
                            <span style={{ color: B.mutedDark, marginLeft: 8 }}>{leg.timeDeparted}</span>
                          )}
                        </div>
                      )}
                      {leg.arrivalPoint && (
                        <div style={{ fontSize: 11 }}>
                          <span style={{ color: B.success }}>↓ ARR </span>
                          <span style={{ color: B.offWhite }}>{leg.arrivalPoint}</span>
                          {leg.timeArrived && (
                            <span style={{ color: B.mutedDark, marginLeft: 8 }}>{leg.timeArrived}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion info */}
              {liveSelected.status === "Completed" && (
                <div
                  style={{
                    background: "rgba(76,175,130,0.06)",
                    border: "1px solid rgba(76,175,130,0.2)",
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontSize: 9, color: B.success, letterSpacing: 2, marginBottom: 8 }}>TASK COMPLETION</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, color: B.mutedDark, letterSpacing: 1 }}>FINAL DESTINATION</div>
                      <div style={{ color: B.offWhite, marginTop: 2, fontSize: 12 }}>{liveSelected.finalDestination || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: B.mutedDark, letterSpacing: 1 }}>COMPLETION TIME</div>
                      <div style={{ color: B.offWhite, marginTop: 2, fontSize: 12 }}>{liveSelected.completionTime || "—"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(13,27,62,0.96)",
          borderTop: `1px solid ${B.navyBorder}`,
          padding: "5px 24px",
          display: "flex",
          justifyContent: "space-between",
          zIndex: 100,
        }}
      >
        <div style={{ fontSize: 9, color: B.mutedDark, letterSpacing: 2 }}>
          HALOGEN GROUP · JOURNEY MANAGEMENT SYSTEM · AUTO-REFRESH 5s
        </div>
        <div style={{ fontSize: 9, color: ongoing.length > 0 ? B.gold : B.mutedDark, letterSpacing: 2, fontWeight: 700 }}>
          {ongoing.length > 0 ? `⚡ ${ongoing.length} ACTIVE OPERATION${ongoing.length > 1 ? "S" : ""}` : "ALL CLEAR"}
        </div>
      </div>
    </div>
  );
}
