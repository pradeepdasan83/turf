'use client';

import React, { useEffect, useState } from 'react';

interface CreateGameModalProps {
  onClose: () => void;
  onGameCreated: () => void;
  organizerId?: string;
}

interface Turf {
  id: string;
  name: string;
  location?: string;
  sport?: string;
  hourlyRate?: number;
}

// Format an ISO date (yyyy-mm-dd) into a friendly label like "Aug 25, 2026"
function prettyDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CreateGameModal({ onClose, onGameCreated, organizerId }: CreateGameModalProps) {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState('5v5 Turf Match');
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [turfId, setTurfId] = useState('');
  const [sport, setSport] = useState('Football');

  const [date, setDate] = useState(todayIso);
  const [multiDates, setMultiDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [totalCost, setTotalCost] = useState('2000');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [bookingType, setBookingType] = useState<'ONETIME' | 'MULTIDATE' | 'RECURRING'>('ONETIME');
  const [recurringWeeks, setRecurringWeeks] = useState('4');
  const [loading, setLoading] = useState(false);

  // Add-your-own-turf sub-form
  const [showAddTurf, setShowAddTurf] = useState(false);
  const [newTurfName, setNewTurfName] = useState('');
  const [newTurfLocation, setNewTurfLocation] = useState('');
  const [newTurfRate, setNewTurfRate] = useState('2000');
  const [addingTurf, setAddingTurf] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Load available turfs
  useEffect(() => {
    fetch('/api/turfs')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.turfs?.length) {
          setTurfs(d.turfs);
          setTurfId((prev) => prev || d.turfs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddTurf = async () => {
    if (!newTurfName.trim()) return;
    setAddingTurf(true);
    try {
      const res = await fetch('/api/turfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTurfName,
          location: newTurfLocation,
          sport,
          hourlyRate: newTurfRate,
        }),
      });
      const data = await res.json();
      if (data.success && data.turf) {
        setTurfs((prev) => [data.turf, ...prev]);
        setTurfId(data.turf.id);
        if (data.turf.hourlyRate) setTotalCost(String(data.turf.hourlyRate));
        setShowAddTurf(false);
        setNewTurfName('');
        setNewTurfLocation('');
      } else {
        alert(data.error || 'Could not add turf');
      }
    } catch (err) {
      console.error('Add turf error:', err);
    } finally {
      setAddingTurf(false);
    }
  };

  const addMultiDate = () => {
    if (date && !multiDates.includes(date)) {
      setMultiDates((prev) => [...prev, date].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (bookingType === 'MULTIDATE' && multiDates.length === 0) {
      setBookingError('Add at least one date for a multi-date booking.');
      return;
    }
    setLoading(true);

    try {
      let dates: string[] = [];
      if (bookingType === 'RECURRING') {
        const weeks = parseInt(recurringWeeks) || 4;
        dates = Array.from({ length: weeks }, (_, i) => prettyDate(addDays(date, i * 7)));
      } else if (bookingType === 'MULTIDATE') {
        dates = multiDates.map(prettyDate);
      }

      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerId,
          title,
          turfId,
          sport,
          date: prettyDate(date),
          startTime,
          endTime,
          totalCost,
          maxPlayers,
          bookingType,
          dates,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onGameCreated();
        onClose();
      } else {
        // 409 = slot already booked; show it inline (not a blocking alert)
        setBookingError(data.error || 'Failed to create game');
      }
    } catch (err) {
      console.error('Create game error:', err);
      setBookingError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-surface-container-low border border-outline-variant rounded-lg p-md text-on-surface focus:outline-primary';
  const labelCls = 'block font-label-bold text-label-bold mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-on-background/50 backdrop-blur-sm flex items-center justify-center p-md overflow-y-auto">
      <div className="bg-surface rounded-2xl p-lg max-w-lg w-full shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-md">
          <h2 className="font-headline-md text-headline-md text-primary font-bold">
            Book Turf &amp; Create Game
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-variant/50 p-1 rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <label className={labelCls}>Game Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          {/* Turf select + add-your-own */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Select Turf</label>
              <button
                type="button"
                onClick={() => setShowAddTurf((v) => !v)}
                className="flex items-center gap-1 text-primary font-label-bold text-label-sm hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showAddTurf ? 'close' : 'add_location_alt'}
                </span>
                {showAddTurf ? 'Cancel' : 'Add your own'}
              </button>
            </div>

            {!showAddTurf ? (
              <select value={turfId} onChange={(e) => setTurfId(e.target.value)} className={inputCls}>
                {turfs.length === 0 && <option value="">Loading turfs…</option>}
                {turfs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.location ? ` — ${t.location}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-md space-y-sm">
                <input
                  type="text"
                  value={newTurfName}
                  onChange={(e) => setNewTurfName(e.target.value)}
                  placeholder="Turf name (e.g. Riverside Arena)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={newTurfLocation}
                  onChange={(e) => setNewTurfLocation(e.target.value)}
                  placeholder="Location / address"
                  className={inputCls}
                />
                <div className="flex gap-sm">
                  <input
                    type="number"
                    value={newTurfRate}
                    onChange={(e) => setNewTurfRate(e.target.value)}
                    placeholder="Hourly rate ₹"
                    className={inputCls + ' flex-1'}
                  />
                  <button
                    type="button"
                    onClick={handleAddTurf}
                    disabled={addingTurf || !newTurfName.trim()}
                    className="px-4 bg-primary text-on-primary rounded-lg font-label-bold hover:bg-primary-fixed-dim disabled:opacity-50"
                  >
                    {addingTurf ? 'Adding…' : 'Save Turf'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Sport</label>
            <select value={sport} onChange={(e) => setSport(e.target.value)} className={inputCls}>
              <option value="Football">Football</option>
              <option value="Tennis">Tennis</option>
              <option value="Basketball">Basketball</option>
              <option value="Cricket">Cricket</option>
            </select>
          </div>

          {/* Booking Schedule Type */}
          <div>
            <label className={labelCls + ' mb-2'}>Booking Schedule</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(
                [
                  ['ONETIME', 'One-Time'],
                  ['MULTIDATE', 'Multi-Date'],
                  ['RECURRING', 'Weekly'],
                ] as const
              ).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBookingType(val)}
                  className={`py-2 px-3 rounded-lg border font-bold ${
                    bookingType === val
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Date (calendar) */}
          <div>
            <label className={labelCls}>
              {bookingType === 'RECURRING' ? 'Start Date' : bookingType === 'MULTIDATE' ? 'Pick Dates' : 'Date'}
            </label>
            <div className="flex gap-sm">
              <input
                type="date"
                value={date}
                min={todayIso}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls + ' flex-1'}
                required
              />
              {bookingType === 'MULTIDATE' && (
                <button
                  type="button"
                  onClick={addMultiDate}
                  className="px-4 bg-primary-container text-on-primary-container rounded-lg font-label-bold hover:brightness-95 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add
                </button>
              )}
            </div>

            {/* Selected multi-dates as chips */}
            {bookingType === 'MULTIDATE' && multiDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-sm">
                {multiDates.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full"
                  >
                    {prettyDate(d)}
                    <button
                      type="button"
                      onClick={() => setMultiDates((prev) => prev.filter((x) => x !== d))}
                      className="hover:text-error"
                      aria-label={`Remove ${prettyDate(d)}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {bookingType === 'RECURRING' && (
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                Creates {recurringWeeks || 0} weekly games starting {prettyDate(date)}.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className={labelCls}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className={labelCls}>Turf Cost (₹)</label>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className={inputCls + ' font-bold text-primary'}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Max Players</label>
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          {bookingType === 'RECURRING' && (
            <div>
              <label className={labelCls}>Recurring Weeks</label>
              <input
                type="number"
                value={recurringWeeks}
                onChange={(e) => setRecurringWeeks(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {bookingError && (
            <div className="flex items-start gap-2 bg-error-container text-on-error-container p-sm rounded-xl text-label-sm font-label-bold border border-error/20">
              <span className="material-symbols-outlined text-[18px]">event_busy</span>
              <span>{bookingError}</span>
            </div>
          )}

          <div className="pt-md flex gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-md border border-outline rounded-lg text-on-surface font-label-bold hover:bg-surface-variant"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !turfId}
              className="flex-1 py-md bg-primary text-on-primary rounded-lg font-label-bold hover:bg-primary-fixed-dim shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Confirm & Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
