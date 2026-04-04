import React, { useEffect, useMemo, useState } from "react";
import { SchoolHeader } from "./UI.jsx";
import { createPlayer, getPlayers, updatePlayer } from "../services/api.js";

function buildRows(count, existingRows = []) {
  return Array.from({ length: count }, (_, index) => {
    const fallbackId = `P${String(index + 1).padStart(3, "0")}`;
    const found = existingRows[index] || {};
    return {
      id: found.id || fallbackId,
      name: found.name || "",
      pin: found.pin || "",
      school: found.school || "شمس المعارف",
      avatar: found.avatar || "🧑‍🎓",
    };
  });
}

export default function AdminPanel({
  adminToken,
  connectedPlayers,
  liveProgress,
  onConnectAdmin,
  onStartRace,
  onBack,
}) {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerRows, setPlayerRows] = useState(() => buildRows(2));
  const [existingPlayers, setExistingPlayers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    onConnectAdmin?.();
  }, [onConnectAdmin]);

  useEffect(() => {
    let active = true;

    async function loadExistingPlayers() {
      try {
        const players = await getPlayers();
        if (!active) return;
        setExistingPlayers(players);
        setPlayerRows((prev) =>
          buildRows(playerCount, prev.length ? prev : players.slice(0, playerCount))
        );
      } catch (_err) {
        if (active) setError("تعذر تحميل قائمة اللاعبين الحالية");
      }
    }

    loadExistingPlayers();
    return () => {
      active = false;
    };
  }, [playerCount]);

  const loggedInCount = connectedPlayers.length;
  const readyCount = useMemo(
    () => connectedPlayers.filter((player) => player.ready).length,
    [connectedPlayers]
  );
  const hasLiveProgress = Object.keys(liveProgress || {}).length > 0;

  function handleCountChange(nextCount) {
    const safeCount = Math.max(2, Math.min(20, Number(nextCount) || 2));
    setPlayerCount(safeCount);
    setPlayerRows((prev) => buildRows(safeCount, prev));
  }

  function updateRow(index, field, value) {
    setPlayerRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      for (const row of playerRows) {
        if (!row.name.trim() || !row.pin.trim()) {
          throw new Error("أكمل الاسم والرمز السري لكل لاعب قبل الحفظ");
        }

        const exists = existingPlayers.find((player) => player.id === row.id);
        const payload = {
          id: row.id.trim().toUpperCase(),
          name: row.name.trim(),
          pin: row.pin.trim(),
          school: row.school || "شمس المعارف",
          avatar: row.avatar || "🧑‍🎓",
        };

        if (exists) {
          await updatePlayer(row.id, payload, adminToken);
        } else {
          await createPlayer(payload, adminToken);
        }
      }

      const refreshed = await getPlayers();
      setExistingPlayers(refreshed);
      setMessage("تم حفظ إعدادات اللاعبين بنجاح");
    } catch (err) {
      setError(err.message || "فشل حفظ إعدادات اللاعبين");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-4 screen-enter">
      <div className="mx-auto max-w-6xl">
        <SchoolHeader subtitle="لوحة تحكم المشرف" />

        <div className="mb-4 flex justify-start">
          <button
            onClick={onBack}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
          >
            رجوع
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <section className="glass-strong rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">إعداد اللاعبين</h2>
                <p className="text-sm text-white/45">حدد العدد ثم أدخل الاسم والرمز السري لكل لاعب.</p>
              </div>
              <div className="w-28">
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={playerCount}
                  onChange={(event) => handleCountChange(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              {playerRows.map((row, index) => (
                <div key={row.id || index} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[120px_1fr_120px]">
                  <input
                    value={row.id}
                    onChange={(event) => updateRow(index, "id", event.target.value.toUpperCase())}
                    className="rounded-xl bg-white/10 px-3 py-3 text-white"
                    dir="ltr"
                    placeholder="P001"
                  />
                  <input
                    value={row.name}
                    onChange={(event) => updateRow(index, "name", event.target.value)}
                    className="rounded-xl bg-white/10 px-3 py-3 text-white"
                    placeholder="اسم اللاعب"
                  />
                  <input
                    value={row.pin}
                    onChange={(event) => updateRow(index, "pin", event.target.value)}
                    className="rounded-xl bg-white/10 px-3 py-3 text-white tracking-[0.3em]"
                    placeholder="1234"
                    dir="ltr"
                    maxLength={4}
                  />
                </div>
              ))}
            </div>

            {message && <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}
            {error && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-gradient-to-l from-brand-500 to-brand-600 py-3.5 font-bold text-white disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ اللاعبين"}
            </button>
          </section>

          <div className="space-y-5">
            <section className="glass-strong rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white">اللاعبون المتصلون</h2>
              <p className="mt-1 text-sm text-white/45">متابعة مباشرة لحالة الدخول والجاهزية.</p>

              <div className="mt-5 flex gap-3">
                <div className="flex-1 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4 text-center">
                  <div className="text-3xl font-black text-white">{loggedInCount}</div>
                  <div className="text-sm text-white/50">متصلون</div>
                </div>
                <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                  <div className="text-3xl font-black text-white">{readyCount}</div>
                  <div className="text-sm text-white/50">جاهزون</div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {connectedPlayers.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/40">
                    لا يوجد لاعبون متصلون بعد.
                  </div>
                )}

                {connectedPlayers.map((player) => (
                  <div key={player.playerId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span className="text-2xl">{player.avatar || "🧑‍🎓"}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{player.name}</div>
                      <div className="text-xs text-white/35" dir="ltr">{player.playerId}</div>
                    </div>
                    <div className={`rounded-xl px-3 py-1 text-xs font-bold ${player.ready ? "border border-emerald-500/20 bg-emerald-500/15 text-emerald-300" : "border border-white/10 bg-white/5 text-white/40"}`}>
                      {player.ready ? "جاهز" : "بانتظار"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {hasLiveProgress && (
              <section className="glass-strong rounded-3xl p-6" dir="rtl">
                <h2 className="text-xl font-bold text-white">تقدم السباق المباشر</h2>
                <p className="mt-1 text-sm text-white/45">متابعة حيّة لتقدم اللاعبين أثناء السباق وبعد انتهائه.</p>

                <div className="mt-5 space-y-3">
                  {connectedPlayers.map((player) => {
                    const stats = liveProgress[player.playerId] || {};
                    const progressValue = Math.max(0, Math.min(100, stats.progress || 0));

                    return (
                      <div
                        key={player.playerId}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{player.avatar || "🧑‍🎓"}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-xs text-white/35" dir="ltr">
                              {player.playerId}
                            </div>
                          </div>
                          {stats.finished && (
                            <div className="rounded-xl border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                              أنهى السباق
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                            <span>التقدم</span>
                            <span>{progressValue}%</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-l from-brand-500 to-emerald-400 transition-all duration-300"
                              style={{ width: `${progressValue}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-100">
                            {`${stats.wpm || 0} WPM`}
                          </div>
                          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
                            {`${stats.accuracy || 0}% دقة`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="glass-strong rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white">بدء السباق</h2>
              <p className="mt-1 text-sm text-white/45">يبدأ العد التنازلي من 10 إلى 0 عند ضغط زر البدء.</p>
              <button
                onClick={onStartRace}
                disabled={loggedInCount < 2}
                className="mt-5 w-full rounded-2xl bg-gradient-to-l from-emerald-500 to-brand-500 py-4 text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ابدأ السباق
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
