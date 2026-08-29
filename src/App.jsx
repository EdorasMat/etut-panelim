import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, BookOpen, ClipboardList, LayoutGrid, Plus, X, Trash2, Check,
  Clock, TrendingUp, ChevronRight, Pencil, Lock,
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ---------- Desen Kilidi ----------
// Doğru desenin SHA-256 özeti (düz metin olarak tutulmuyor)
const PATTERN_HASH = "eec8d53877f6a527a2c227272cc42ae50ea691c2f5a53c37e121af04c12b7fff";
const PATTERN_MIN_DOTS = 4;
const PATTERN_UNLOCK_KEY = "etut-panelim-kilit-acik";

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function PatternLockScreen({ onUnlock }) {
  const [path, setPath] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const svgRef = React.useRef(null);

  const dotPositions = [
    [50, 50], [150, 50], [250, 50],
    [50, 150], [150, 150], [250, 150],
    [50, 250], [150, 250], [250, 250],
  ];

  const getRelativePoint = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 300 / rect.width;
    const scaleY = 300 / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const hitDot = (x, y) => {
    for (let i = 0; i < dotPositions.length; i++) {
      const [dx, dy] = dotPositions[i];
      if (Math.hypot(dx - x, dy - y) < 26) return i;
    }
    return -1;
  };

  const startDraw = (clientX, clientY) => {
    if (checking) return;
    const { x, y } = getRelativePoint(clientX, clientY);
    const idx = hitDot(x, y);
    setError(false);
    if (idx !== -1) {
      setPath([idx]);
      setDrawing(true);
    }
  };
  const moveDraw = (clientX, clientY) => {
    if (!drawing || checking) return;
    const { x, y } = getRelativePoint(clientX, clientY);
    const idx = hitDot(x, y);
    if (idx !== -1 && !path.includes(idx)) setPath((p) => [...p, idx]);
  };
  const endDraw = async () => {
    if (!drawing) return;
    setDrawing(false);
    if (path.length < PATTERN_MIN_DOTS) {
      setError(true);
      setTimeout(() => { setPath([]); setError(false); }, 500);
      return;
    }
    setChecking(true);
    const candidate = path.map((i) => i + 1).join("");
    const hash = await sha256Hex(candidate);
    if (hash === PATTERN_HASH) {
      try { localStorage.setItem(PATTERN_UNLOCK_KEY, "1"); } catch (e) {}
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => { setPath([]); setError(false); setChecking(false); }, 500);
    }
  };

  const lineColor = error ? "#E68B7F" : "#7B84EC";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: "#FAF7F1" }}>
      <div className="text-center">
        <div className="mx-auto mb-3 w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#7B84EC22" }}>
          <Lock size={20} style={{ color: "#5D63C9" }} />
        </div>
        <div className="font-semibold" style={{ color: "#2B2822" }}>Etüt Panelim</div>
        <div className="text-xs mt-1" style={{ color: error ? "#E68B7F" : "#8A8377" }}>
          {error ? "Desen yanlış, tekrar dene" : "Devam etmek için deseni çiz"}
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        width="260"
        height="260"
        style={{ touchAction: "none", userSelect: "none" }}
        onMouseDown={(e) => startDraw(e.clientX, e.clientY)}
        onMouseMove={(e) => e.buttons === 1 && moveDraw(e.clientX, e.clientY)}
        onMouseUp={endDraw}
        onMouseLeave={() => drawing && endDraw()}
        onTouchStart={(e) => startDraw(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => { e.preventDefault(); moveDraw(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchEnd={endDraw}
      >
        {path.slice(1).map((idx, i) => {
          const [x1, y1] = dotPositions[path[i]];
          const [x2, y2] = dotPositions[idx];
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth={5} strokeLinecap="round" />;
        })}
        {dotPositions.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={24} fill={path.includes(i) ? lineColor + "22" : "white"} stroke={path.includes(i) ? lineColor : "#00000018"} strokeWidth={2} />
            <circle cx={x} cy={y} r={path.includes(i) ? 8 : 6} fill={path.includes(i) ? lineColor : "#00000030"} />
          </g>
        ))}
      </svg>
      <div className="text-xs" style={{ color: "#8A8377" }}>En az {PATTERN_MIN_DOTS} nokta birleştir</div>
    </div>
  );
}

// ---------- Sabitler ----------
const SUBJECTS = ["Matematik", "Geometri", "Türkçe", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya"];
const ACCENT = {
  primary: "#7B84EC",
  primaryDeep: "#5D63C9",
  sage: "#8FB79A",
  peach: "#EFAE72",
  coral: "#E68B7F",
  paper: "#FAF7F1",
  ink: "#2B2822",
  inkSoft: "#8A8377",
};
const SUBJECT_COLORS = ["#7B84EC", "#8FB79A", "#EFAE72", "#E68B7F", "#6FB3B8", "#C79FE0", "#D8B26B", "#7FAED9"];
const subjectColor = (s) => SUBJECT_COLORS[SUBJECTS.indexOf(s) % SUBJECT_COLORS.length] || ACCENT.primary;

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
};
const netOf = (c, w) => Math.max(0, (Number(c) || 0) - (Number(w) || 0) / 4);

// ---------- Supabase <-> uygulama alan adı eşlemesi ----------
const mapStudentFromDb = (r) => ({ id: r.id, name: r.name, grade: r.grade, phone: r.phone, notes: r.notes });
const mapStudentToDb = (s) => ({ name: s.name, grade: s.grade || null, phone: s.phone || null, notes: s.notes || null });

const mapSessionFromDb = (r) => ({ id: r.id, studentId: r.student_id, date: r.date, subject: r.subject, duration: r.duration, topic: r.topic, notes: r.notes });
const mapSessionToDb = (s) => ({ student_id: s.studentId, date: s.date, subject: s.subject, duration: s.duration, topic: s.topic || null, notes: s.notes || null });

const mapExamFromDb = (r) => ({ id: r.id, studentId: r.student_id, date: r.date, examName: r.exam_name, subjects: r.subjects });
const mapExamToDb = (e) => ({ student_id: e.studentId, date: e.date, exam_name: e.examName || null, subjects: e.subjects });

const mapTaskFromDb = (r) => ({ id: r.id, studentId: r.student_id, title: r.title, dueDate: r.due_date, done: r.done });
const mapTaskToDb = (t) => ({ student_id: t.studentId, title: t.title, due_date: t.dueDate, done: !!t.done });

// ---------- Küçük UI parçaları ----------
function Avatar({ name, size = 40 }) {
  const initials = (name || "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const hue = useMemo(() => {
    let h = 0;
    for (const c of name || "") h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }, [name]);
  return (
    <div
      style={{ width: size, height: size, background: `hsl(${hue} 55% 90%)`, color: `hsl(${hue} 40% 32%)` }}
      className="rounded-2xl flex items-center justify-center font-semibold shrink-0"
    >
      <span style={{ fontSize: size * 0.36 }}>{initials}</span>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-3xl shadow-[0_2px_20px_rgba(43,40,34,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <Card className="p-4 flex items-center gap-3 flex-1 min-w-[140px]">
      <div className="rounded-2xl p-2.5" style={{ background: color + "22" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-xs" style={{ color: ACCENT.inkSoft }}>{label}</div>
        <div className="text-lg font-bold" style={{ color: ACCENT.ink }}>{value}</div>
      </div>
    </Card>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px] p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-[slideUp_.2s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white rounded-t-3xl">
          <h3 className="font-bold text-lg" style={{ color: ACCENT.ink }}>{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium mb-1" style={{ color: ACCENT.inkSoft }}>{label}</span>
      {children}
    </label>
  );
}
const inputCls =
  "w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B84EC]/40 bg-[#FAF7F1]";

function PrimaryButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl py-2.5 font-semibold text-white text-sm transition active:scale-[0.98] disabled:opacity-50 ${className}`}
      style={{ background: ACCENT.primary }}
    >
      {children}
    </button>
  );
}

// ---------- Ana Uygulama ----------
export default function App() {
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem(PATTERN_UNLOCK_KEY) === "1"; } catch (e) { return false; }
  });

  if (!unlocked) {
    return <PatternLockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return <UnlockedApp />;
}

function UnlockedApp() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState("panel");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [studentModal, setStudentModal] = useState(null);
  const [sessionModal, setSessionModal] = useState(null);
  const [examModal, setExamModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);

  const fetchAll = async () => {
    const [s, se, ex, t] = await Promise.all([
      supabase.from("students").select("*").order("created_at", { ascending: true }),
      supabase.from("study_sessions").select("*").order("date", { ascending: false }),
      supabase.from("exam_results").select("*").order("date", { ascending: false }),
      supabase.from("tasks").select("*").order("due_date", { ascending: true }),
    ]);
    if (s.error || se.error || ex.error || t.error) {
      setErrorMsg("Veritabanına bağlanırken bir sorun oluştu. Supabase bağlantı bilgilerini kontrol et.");
      return;
    }
    setStudents(s.data.map(mapStudentFromDb));
    setSessions(se.data.map(mapSessionFromDb));
    setExams(ex.data.map(mapExamFromDb));
    setTasks(t.data.map(mapTaskFromDb));
    setErrorMsg("");
  };

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));

    // Başka bir cihazdan (ör. telefon) yapılan değişiklikleri anlık yakala
    const channel = supabase
      .channel("etut-panelim-degisiklikler")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_sessions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "exam_results" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentName = (id) => students.find((s) => s.id === id)?.name || "Bilinmeyen";

  // ---- CRUD (Supabase) ----
  const upsertStudent = async (data) => {
    setSaving(true);
    if (data.id) {
      await supabase.from("students").update(mapStudentToDb(data)).eq("id", data.id);
    } else {
      await supabase.from("students").insert(mapStudentToDb(data));
    }
    await fetchAll();
    setSaving(false);
    setStudentModal(null);
  };
  const deleteStudent = async (id) => {
    if (!confirm("Bu öğrenciyi ve tüm kayıtlarını silmek istediğine emin misin?")) return;
    await supabase.from("students").delete().eq("id", id);
    await fetchAll();
    if (selectedStudentId === id) setSelectedStudentId(null);
  };

  const upsertSession = async (data) => {
    setSaving(true);
    if (data.id) await supabase.from("study_sessions").update(mapSessionToDb(data)).eq("id", data.id);
    else await supabase.from("study_sessions").insert(mapSessionToDb(data));
    await fetchAll();
    setSaving(false);
    setSessionModal(null);
  };
  const deleteSession = async (id) => { await supabase.from("study_sessions").delete().eq("id", id); await fetchAll(); };

  const upsertExam = async (data) => {
    setSaving(true);
    if (data.id) await supabase.from("exam_results").update(mapExamToDb(data)).eq("id", data.id);
    else await supabase.from("exam_results").insert(mapExamToDb(data));
    await fetchAll();
    setSaving(false);
    setExamModal(null);
  };
  const deleteExam = async (id) => { await supabase.from("exam_results").delete().eq("id", id); await fetchAll(); };

  const upsertTask = async (data) => {
    setSaving(true);
    if (data.id) await supabase.from("tasks").update(mapTaskToDb(data)).eq("id", data.id);
    else await supabase.from("tasks").insert(mapTaskToDb(data));
    await fetchAll();
    setSaving(false);
    setTaskModal(null);
  };
  const toggleTask = async (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    await supabase.from("tasks").update({ done: !t.done }).eq("id", id);
    await fetchAll();
  };
  const deleteTask = async (id) => { await supabase.from("tasks").delete().eq("id", id); await fetchAll(); };

  // ---- Türetilmiş veriler ----
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);
  const weeklyMinutes = useMemo(
    () => sessions.filter((s) => s.date >= weekAgo).reduce((a, s) => a + Number(s.duration || 0), 0),
    [sessions, weekAgo]
  );
  const pendingTasks = tasks.filter((t) => !t.done);
  const lastExamAvgNet = useMemo(() => {
    if (!exams.length) return null;
    const totals = exams.map((e) => e.subjects.reduce((a, s) => a + netOf(s.correct, s.wrong), 0));
    return (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1);
  }, [exams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: ACCENT.paper }}>
        <div className="text-sm" style={{ color: ACCENT.inkSoft }}>Yükleniyor…</div>
      </div>
    );
  }

  const navItems = [
    { id: "panel", label: "Panel", icon: LayoutGrid },
    { id: "students", label: "Öğrenciler", icon: Users },
    { id: "sessions", label: "Etüt", icon: BookOpen },
    { id: "exams", label: "Sınavlar", icon: TrendingUp },
    { id: "tasks", label: "Ödevler", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: ACCENT.paper, fontFamily: "Inter, system-ui, sans-serif" }}>
      {errorMsg && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-[#E68B7F] text-white text-xs text-center py-2 px-4">
          {errorMsg}
        </div>
      )}

      {/* Masaüstü kenar çubuğu */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 py-6 px-4 gap-1">
        <div className="px-2 mb-6">
          <div className="font-display text-xl font-semibold" style={{ color: ACCENT.ink }}>Etüt Panelim</div>
          <div className="text-xs mt-0.5" style={{ color: ACCENT.inkSoft }}>Öğrenci takip sistemi</div>
        </div>
        {navItems.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition"
            style={{
              background: tab === n.id ? ACCENT.primary : "transparent",
              color: tab === n.id ? "white" : ACCENT.ink,
            }}
          >
            <n.icon size={18} />
            {n.label}
          </button>
        ))}
      </aside>

      {/* İçerik */}
      <main className="flex-1 pb-24 md:pb-6 px-4 sm:px-6 pt-6 max-w-4xl mx-auto w-full">
        <div className="md:hidden mb-5">
          <div className="font-display text-xl font-semibold" style={{ color: ACCENT.ink }}>Etüt Panelim</div>
        </div>

        {tab === "panel" && (
          <PanelView
            students={students}
            weeklyMinutes={weeklyMinutes}
            pendingTasks={pendingTasks}
            lastExamAvgNet={lastExamAvgNet}
            exams={exams}
            sessions={sessions}
            tasks={tasks}
            onSelectStudent={(id) => { setSelectedStudentId(id); setTab("students"); }}
          />
        )}

        {tab === "students" && (
          <StudentsView
            students={students}
            sessions={sessions}
            exams={exams}
            tasks={tasks}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            onAdd={() => setStudentModal({})}
            onEdit={(s) => setStudentModal(s)}
            onDelete={deleteStudent}
            onAddSession={(studentId) => setSessionModal({ studentId, date: todayISO() })}
            onAddExam={(studentId) => setExamModal({ studentId, date: todayISO(), examName: "", subjects: [{ subject: SUBJECTS[0], correct: "", wrong: "", empty: "" }] })}
            onAddTask={(studentId) => setTaskModal({ studentId, dueDate: todayISO(), title: "" })}
            onDeleteSession={deleteSession}
            onDeleteExam={deleteExam}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        )}

        {tab === "sessions" && (
          <SessionsView sessions={sessions} students={students} studentName={studentName}
            onAdd={() => setSessionModal({ date: todayISO() })} onDelete={deleteSession} />
        )}

        {tab === "exams" && (
          <ExamsView exams={exams} students={students} studentName={studentName}
            onAdd={() => setExamModal({ date: todayISO(), examName: "", subjects: [{ subject: SUBJECTS[0], correct: "", wrong: "", empty: "" }] })}
            onDelete={deleteExam} />
        )}

        {tab === "tasks" && (
          <TasksView tasks={tasks} students={students} studentName={studentName}
            onAdd={() => setTaskModal({ dueDate: todayISO(), title: "" })} onToggle={toggleTask} onDelete={deleteTask} />
        )}
      </main>

      {/* Mobil alt gezinme */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 flex justify-around py-2 z-40">
        {navItems.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-medium"
            style={{ color: tab === n.id ? ACCENT.primary : ACCENT.inkSoft }}
          >
            <n.icon size={20} />
            {n.label}
          </button>
        ))}
      </nav>

      {studentModal && <StudentModal data={studentModal} onClose={() => setStudentModal(null)} onSave={upsertStudent} saving={saving} />}
      {sessionModal && <SessionModal data={sessionModal} students={students} onClose={() => setSessionModal(null)} onSave={upsertSession} saving={saving} />}
      {examModal && <ExamModal data={examModal} students={students} onClose={() => setExamModal(null)} onSave={upsertExam} saving={saving} />}
      {taskModal && <TaskModal data={taskModal} students={students} onClose={() => setTaskModal(null)} onSave={upsertTask} saving={saving} />}
    </div>
  );
}

// ---------- Panel (Dashboard) ----------
function PanelView({ students, weeklyMinutes, pendingTasks, lastExamAvgNet, exams, sessions, tasks, onSelectStudent }) {
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const weeklyStudentCounts = useMemo(() => {
    const counts = {};
    sessions.filter((s) => s.date >= weekAgo).forEach((s) => {
      counts[s.studentId] = (counts[s.studentId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([studentId, count]) => ({ studentId, count, name: students.find((st) => st.id === studentId)?.name || "Bilinmeyen" }))
      .sort((a, b) => b.count - a.count);
  }, [sessions, students, weekAgo]);

  const trendData = useMemo(() => {
    const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((e) => ({
      date: fmtDate(e.date).replace(/\s\d{4}$/, ""),
      net: Number(e.subjects.reduce((a, s) => a + netOf(s.correct, s.wrong), 0).toFixed(1)),
    }));
  }, [exams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <StatPill icon={Users} label="Öğrenci" value={students.length} color={ACCENT.primary} />
        <StatPill icon={TrendingUp} label="Ort. net (son sınavlar)" value={lastExamAvgNet ?? "—"} color={ACCENT.peach} />
        <StatPill icon={ClipboardList} label="Bekleyen ödev" value={pendingTasks.length} color={ACCENT.coral} />
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} style={{ color: ACCENT.sage }} />
          <div className="font-display font-semibold" style={{ color: ACCENT.ink }}>Bu hafta etüt</div>
        </div>
        {weeklyStudentCounts.length === 0 ? (
          <div className="text-sm" style={{ color: ACCENT.inkSoft }}>Bu hafta henüz etüt kaydı yok.</div>
        ) : (
          <div className="space-y-2.5">
            {weeklyStudentCounts.map((item) => (
              <div key={item.studentId} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate" style={{ color: ACCENT.ink }}>{item.name}</span>
                <span className="text-sm font-mono font-semibold shrink-0 ml-3" style={{ color: ACCENT.sage }}>
                  {item.count} etüt
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {exams.length > 0 && (
        <Card className="p-5">
          <div className="font-display font-semibold mb-3" style={{ color: ACCENT.ink }}>Net Gelişimi</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: ACCENT.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: ACCENT.inkSoft }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Line type="monotone" dataKey="net" stroke={ACCENT.primary} strokeWidth={2.5} dot={{ r: 3, fill: ACCENT.primary }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div>
        <div className="font-display font-semibold mb-3" style={{ color: ACCENT.ink }}>Öğrenciler</div>
        {students.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-sm" style={{ color: ACCENT.inkSoft }}>Henüz öğrenci eklenmedi. "Öğrenciler" sekmesinden başla.</div>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {students.map((s) => {
              const studentSessions = sessions.filter((x) => x.studentId === s.id);
              const studentExams = exams.filter((x) => x.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date));
              const lastNet = studentExams[0] ? studentExams[0].subjects.reduce((a, x) => a + netOf(x.correct, x.wrong), 0).toFixed(1) : null;
              const openTasks = tasks.filter((t) => t.studentId === s.id && !t.done).length;
              return (
                <Card key={s.id} className="p-0 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onSelectStudent(s.id)}
                    className="w-full text-left p-4 flex items-center gap-3 active:bg-black/5 transition"
                  >
                    <Avatar name={s.name} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: ACCENT.ink }}>{s.name}</div>
                      <div className="text-xs" style={{ color: ACCENT.inkSoft }}>
                        {s.grade ? `${s.grade} · ` : ""}{studentSessions.length} etüt kaydı
                        {lastNet && ` · son net ${lastNet}`}
                        {openTasks > 0 && ` · ${openTasks} ödev`}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: ACCENT.inkSoft }} />
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Öğrenciler ----------
function StudentsView({
  students, sessions, exams, tasks, selectedStudentId, setSelectedStudentId,
  onAdd, onEdit, onDelete, onAddSession, onAddExam, onAddTask, onDeleteSession, onDeleteExam, onToggleTask, onDeleteTask,
}) {
  const selected = students.find((s) => s.id === selectedStudentId);

  if (selected) {
    const studentSessions = sessions.filter((s) => s.studentId === selected.id).sort((a, b) => b.date.localeCompare(a.date));
    const studentExams = exams.filter((e) => e.studentId === selected.id).sort((a, b) => b.date.localeCompare(a.date));
    const studentTasks = tasks.filter((t) => t.studentId === selected.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedStudentId(null)} className="text-sm font-medium flex items-center gap-1" style={{ color: ACCENT.primary }}>
          ← Tüm öğrenciler
        </button>

        <Card className="p-5 flex items-center gap-4">
          <Avatar name={selected.name} size={56} />
          <div className="flex-1">
            <div className="font-display text-lg font-semibold" style={{ color: ACCENT.ink }}>{selected.name}</div>
            <div className="text-xs" style={{ color: ACCENT.inkSoft }}>{selected.grade}{selected.phone ? ` · ${selected.phone}` : ""}</div>
            {selected.notes && <div className="text-xs mt-1" style={{ color: ACCENT.inkSoft }}>{selected.notes}</div>}
          </div>
          <button onClick={() => onEdit(selected)} className="p-2 rounded-full hover:bg-black/5"><Pencil size={16} /></button>
          <button onClick={() => onDelete(selected.id)} className="p-2 rounded-full hover:bg-black/5"><Trash2 size={16} style={{ color: ACCENT.coral }} /></button>
        </Card>

        <SectionBlock title="Etüt Kayıtları" onAdd={() => onAddSession(selected.id)}>
          {studentSessions.length === 0 ? <EmptyRow text="Henüz etüt kaydı yok." /> :
            studentSessions.map((s) => (
              <RowItem key={s.id} onDelete={() => onDeleteSession(s.id)}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: subjectColor(s.subject) }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: ACCENT.ink }}>{s.subject}{s.topic ? ` · ${s.topic}` : ""}</div>
                  <div className="text-xs" style={{ color: ACCENT.inkSoft }}>{fmtDate(s.date)} · {s.duration} dk</div>
                </div>
              </RowItem>
            ))}
        </SectionBlock>

        <SectionBlock title="Sınav Sonuçları" onAdd={() => onAddExam(selected.id)}>
          {studentExams.length === 0 ? <EmptyRow text="Henüz sınav sonucu yok." /> :
            studentExams.map((e) => {
              const total = e.subjects.reduce((a, s) => a + netOf(s.correct, s.wrong), 0);
              return (
                <RowItem key={e.id} onDelete={() => onDeleteExam(e.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: ACCENT.ink }}>{e.examName || "Deneme"}</div>
                    <div className="text-xs" style={{ color: ACCENT.inkSoft }}>{fmtDate(e.date)} · {e.subjects.map((s) => s.subject).join(", ")}</div>
                  </div>
                  <div className="font-mono text-sm font-bold shrink-0" style={{ color: ACCENT.primary }}>{total.toFixed(1)} net</div>
                </RowItem>
              );
            })}
        </SectionBlock>

        <SectionBlock title="Ödevler" onAdd={() => onAddTask(selected.id)}>
          {studentTasks.length === 0 ? <EmptyRow text="Henüz ödev eklenmedi." /> :
            studentTasks.map((t) => (
              <RowItem key={t.id} onDelete={() => onDeleteTask(t.id)}>
                <button onClick={() => onToggleTask(t.id)} className="shrink-0">
                  <CheckCircle done={t.done} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${t.done ? "line-through" : ""}`} style={{ color: t.done ? ACCENT.inkSoft : ACCENT.ink }}>{t.title}</div>
                  <div className="text-xs" style={{ color: ACCENT.inkSoft }}>Son tarih: {fmtDate(t.dueDate)}</div>
                </div>
              </RowItem>
            ))}
        </SectionBlock>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg font-semibold" style={{ color: ACCENT.ink }}>Öğrenciler</div>
        <button onClick={onAdd} className="rounded-full p-2.5 text-white" style={{ background: ACCENT.primary }}><Plus size={18} /></button>
      </div>
      {students.length === 0 ? (
        <Card className="p-8 text-center"><div className="text-sm" style={{ color: ACCENT.inkSoft }}>Henüz öğrenci yok. Sağ üstten ekleyebilirsin.</div></Card>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <Card key={s.id} className="p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setSelectedStudentId(s.id)}
                className="w-full text-left p-3.5 flex items-center gap-3 active:bg-black/5 transition"
              >
                <Avatar name={s.name} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: ACCENT.ink }}>{s.name}</div>
                  <div className="text-xs" style={{ color: ACCENT.inkSoft }}>{s.grade || "Sınıf belirtilmedi"}</div>
                </div>
                <ChevronRight size={16} style={{ color: ACCENT.inkSoft }} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckCircle({ done }) {
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center border-2" style={{ borderColor: done ? ACCENT.sage : "#00000022", background: done ? ACCENT.sage : "transparent" }}>
      {done && <Check size={12} color="white" strokeWidth={3} />}
    </div>
  );
}

function SectionBlock({ title, onAdd, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="font-semibold text-sm" style={{ color: ACCENT.ink }}>{title}</div>
        <button onClick={onAdd} className="text-xs font-semibold flex items-center gap-1" style={{ color: ACCENT.primary }}>
          <Plus size={14} /> Ekle
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function RowItem({ children, onDelete }) {
  return (
    <Card className="p-3 flex items-center gap-3 group">
      {children}
      <button onClick={onDelete} className="p-1.5 rounded-full hover:bg-black/5 opacity-60 hover:opacity-100 shrink-0">
        <Trash2 size={14} style={{ color: ACCENT.coral }} />
      </button>
    </Card>
  );
}
function EmptyRow({ text }) {
  return <div className="text-xs py-3 px-1" style={{ color: ACCENT.inkSoft }}>{text}</div>;
}

// ---------- Etüt Listesi ----------
function SessionsView({ sessions, students, studentName, onAdd, onDelete }) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg font-semibold" style={{ color: ACCENT.ink }}>Etüt Kayıtları</div>
        <button onClick={onAdd} disabled={students.length === 0} className="rounded-full p-2.5 text-white disabled:opacity-40" style={{ background: ACCENT.primary }}><Plus size={18} /></button>
      </div>
      {students.length === 0 ? <EmptyState text="Önce Öğrenciler sekmesinden bir öğrenci ekle." /> :
        sorted.length === 0 ? <EmptyState text="Henüz etüt kaydı yok." /> : (
          <div className="space-y-2">
            {sorted.map((s) => (
              <RowItem key={s.id} onDelete={() => onDelete(s.id)}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: subjectColor(s.subject) }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: ACCENT.ink }}>{studentName(s.studentId)} · {s.subject}</div>
                  <div className="text-xs" style={{ color: ACCENT.inkSoft }}>{fmtDate(s.date)} · {s.duration} dk{s.topic ? ` · ${s.topic}` : ""}</div>
                </div>
              </RowItem>
            ))}
          </div>
        )}
    </div>
  );
}

// ---------- Sınav Listesi ----------
function ExamsView({ exams, students, studentName, onAdd, onDelete }) {
  const sorted = [...exams].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg font-semibold" style={{ color: ACCENT.ink }}>Sınav Sonuçları</div>
        <button onClick={onAdd} disabled={students.length === 0} className="rounded-full p-2.5 text-white disabled:opacity-40" style={{ background: ACCENT.primary }}><Plus size={18} /></button>
      </div>
      {students.length === 0 ? <EmptyState text="Önce Öğrenciler sekmesinden bir öğrenci ekle." /> :
        sorted.length === 0 ? <EmptyState text="Henüz sınav sonucu yok." /> : (
          <div className="space-y-2">
            {sorted.map((e) => {
              const total = e.subjects.reduce((a, s) => a + netOf(s.correct, s.wrong), 0);
              return (
                <RowItem key={e.id} onDelete={() => onDelete(e.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: ACCENT.ink }}>{studentName(e.studentId)} · {e.examName || "Deneme"}</div>
                    <div className="text-xs" style={{ color: ACCENT.inkSoft }}>{fmtDate(e.date)} · {e.subjects.map((s) => s.subject).join(", ")}</div>
                  </div>
                  <div className="font-mono text-sm font-bold shrink-0" style={{ color: ACCENT.primary }}>{total.toFixed(1)} net</div>
                </RowItem>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ---------- Ödev Listesi ----------
function TasksView({ tasks, students, studentName, onAdd, onToggle, onDelete }) {
  const sorted = [...tasks].sort((a, b) => (a.done - b.done) || a.dueDate.localeCompare(b.dueDate));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg font-semibold" style={{ color: ACCENT.ink }}>Ödevler</div>
        <button onClick={onAdd} disabled={students.length === 0} className="rounded-full p-2.5 text-white disabled:opacity-40" style={{ background: ACCENT.primary }}><Plus size={18} /></button>
      </div>
      {students.length === 0 ? <EmptyState text="Önce Öğrenciler sekmesinden bir öğrenci ekle." /> :
        sorted.length === 0 ? <EmptyState text="Henüz ödev eklenmedi." /> : (
          <div className="space-y-2">
            {sorted.map((t) => (
              <RowItem key={t.id} onDelete={() => onDelete(t.id)}>
                <button onClick={() => onToggle(t.id)} className="shrink-0"><CheckCircle done={t.done} /></button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${t.done ? "line-through" : ""}`} style={{ color: t.done ? ACCENT.inkSoft : ACCENT.ink }}>{studentName(t.studentId)} · {t.title}</div>
                  <div className="text-xs" style={{ color: ACCENT.inkSoft }}>Son tarih: {fmtDate(t.dueDate)}</div>
                </div>
              </RowItem>
            ))}
          </div>
        )}
    </div>
  );
}

function EmptyState({ text }) {
  return <Card className="p-8 text-center"><div className="text-sm" style={{ color: ACCENT.inkSoft }}>{text}</div></Card>;
}

// ---------- Modallar ----------
function StudentModal({ data, onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: data.name || "", grade: data.grade || "", phone: data.phone || "", notes: data.notes || "", id: data.id });
  return (
    <Modal title={data.id ? "Öğrenciyi Düzenle" : "Yeni Öğrenci"} onClose={onClose}>
      <Field label="Ad Soyad *">
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn. Elif Yılmaz" />
      </Field>
      <Field label="Sınıf / Hedef">
        <input className={inputCls} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Örn. 11. Sınıf · TYT" />
      </Field>
      <Field label="Telefon (opsiyonel)">
        <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05xx xxx xx xx" />
      </Field>
      <Field label="Not (opsiyonel)">
        <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Güçlü/zayıf yönler, veli notu vb." />
      </Field>
      <PrimaryButton disabled={saving} onClick={() => form.name.trim() && onSave(form)} className="mt-2">{saving ? "Kaydediliyor…" : "Kaydet"}</PrimaryButton>
    </Modal>
  );
}

function SessionModal({ data, students, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    id: data.id, studentId: data.studentId || students[0]?.id || "",
    date: data.date || todayISO(), subject: data.subject || SUBJECTS[0],
    duration: data.duration || "", topic: data.topic || "", notes: data.notes || "",
  });
  return (
    <Modal title={data.id ? "Etüt Kaydını Düzenle" : "Yeni Etüt Kaydı"} onClose={onClose}>
      <Field label="Öğrenci *">
        <select className={inputCls} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tarih"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Süre (dk) *"><input type="number" min="1" className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60" /></Field>
      </div>
      <Field label="Ders">
        <select className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Konu (opsiyonel)">
        <input className={inputCls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Örn. İkinci Dereceden Denklemler" />
      </Field>
      <PrimaryButton disabled={saving} onClick={() => form.studentId && form.duration && onSave({ ...form, duration: Number(form.duration) })} className="mt-2">{saving ? "Kaydediliyor…" : "Kaydet"}</PrimaryButton>
    </Modal>
  );
}

function ExamModal({ data, students, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    id: data.id, studentId: data.studentId || students[0]?.id || "",
    date: data.date || todayISO(), examName: data.examName || "",
    subjects: data.subjects && data.subjects.length ? data.subjects : [{ subject: SUBJECTS[0], correct: "", wrong: "", empty: "" }],
  });
  const updateSubject = (i, patch) => {
    const next = [...form.subjects];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, subjects: next });
  };
  const addSubjectRow = () => setForm({ ...form, subjects: [...form.subjects, { subject: SUBJECTS[0], correct: "", wrong: "", empty: "" }] });
  const removeSubjectRow = (i) => setForm({ ...form, subjects: form.subjects.filter((_, idx) => idx !== i) });

  const totalNet = form.subjects.reduce((a, s) => a + netOf(s.correct, s.wrong), 0);

  return (
    <Modal title={data.id ? "Sınav Sonucunu Düzenle" : "Yeni Sınav Sonucu"} onClose={onClose}>
      <Field label="Öğrenci *">
        <select className={inputCls} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tarih"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Sınav Adı"><input className={inputCls} value={form.examName} onChange={(e) => setForm({ ...form, examName: e.target.value })} placeholder="Örn. 3D TYT Deneme 4" /></Field>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: ACCENT.inkSoft }}>Ders Bazlı Sonuçlar</span>
        <button onClick={addSubjectRow} className="text-xs font-semibold flex items-center gap-1" style={{ color: ACCENT.primary }}><Plus size={13} /> Ders ekle</button>
      </div>
      <div className="space-y-2 mb-3">
        {form.subjects.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-[#FAF7F1] rounded-xl p-2">
            <select className="rounded-lg border border-black/10 px-2 py-2 text-xs flex-1 min-w-0 bg-white" value={s.subject} onChange={(e) => updateSubject(i, { subject: e.target.value })}>
              {SUBJECTS.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
            </select>
            <input type="number" placeholder="D" title="Doğru" className="w-12 rounded-lg border border-black/10 px-1.5 py-2 text-xs text-center bg-white" value={s.correct} onChange={(e) => updateSubject(i, { correct: e.target.value })} />
            <input type="number" placeholder="Y" title="Yanlış" className="w-12 rounded-lg border border-black/10 px-1.5 py-2 text-xs text-center bg-white" value={s.wrong} onChange={(e) => updateSubject(i, { wrong: e.target.value })} />
            <input type="number" placeholder="B" title="Boş" className="w-12 rounded-lg border border-black/10 px-1.5 py-2 text-xs text-center bg-white" value={s.empty} onChange={(e) => updateSubject(i, { empty: e.target.value })} />
            <button onClick={() => removeSubjectRow(i)} className="p-1.5 shrink-0"><X size={14} style={{ color: ACCENT.coral }} /></button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl px-3 py-2.5 mb-4" style={{ background: ACCENT.primary + "15" }}>
        <span className="text-xs font-medium" style={{ color: ACCENT.ink }}>Toplam Net</span>
        <span className="font-mono font-bold text-sm" style={{ color: ACCENT.primaryDeep }}>{totalNet.toFixed(2)}</span>
      </div>

      <PrimaryButton disabled={saving} onClick={() => form.studentId && onSave(form)}>{saving ? "Kaydediliyor…" : "Kaydet"}</PrimaryButton>
    </Modal>
  );
}

function TaskModal({ data, students, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    id: data.id, studentId: data.studentId || students[0]?.id || "",
    title: data.title || "", dueDate: data.dueDate || todayISO(), done: data.done || false,
  });
  return (
    <Modal title={data.id ? "Ödevi Düzenle" : "Yeni Ödev"} onClose={onClose}>
      <Field label="Öğrenci *">
        <select className={inputCls} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="Ödev / Görev *">
        <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn. 50 soru problem testi" />
      </Field>
      <Field label="Son Tarih">
        <input type="date" className={inputCls} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      </Field>
      <PrimaryButton disabled={saving} onClick={() => form.studentId && form.title.trim() && onSave(form)} className="mt-2">{saving ? "Kaydediliyor…" : "Kaydet"}</PrimaryButton>
    </Modal>
  );
}
