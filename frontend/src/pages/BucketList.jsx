import React, { useState, useEffect } from 'react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Small self-contained month calendar - no external date library needed.
function MonthCalendar({ selectedDate, onSelectDate, scheduledDateKeys }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div style={styles.calendarBox}>
      <div style={styles.calendarHeader}>
        <button style={styles.calendarNavBtn} onClick={goPrevMonth}>‹</button>
        <span style={styles.calendarTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button style={styles.calendarNavBtn} onClick={goNextMonth}>›</button>
      </div>

      <div style={styles.calendarWeekRow}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={styles.calendarWeekday}>{d}</div>
        ))}
      </div>

      <div style={styles.calendarGrid}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const key = toDateKey(viewYear, viewMonth, day);
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          const hasEvent = scheduledDateKeys.has(key);

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(key)}
              style={{
                ...styles.calendarDay,
                background: isSelected ? '#a855f7' : isToday ? 'rgba(168,85,247,0.15)' : 'transparent',
                color: isSelected ? '#fff' : '#e2e8f0',
                fontWeight: isSelected || isToday ? '700' : '400'
              }}
            >
              {day}
              {hasEvent && <span style={{ ...styles.eventDot, background: isSelected ? '#fff' : '#a855f7' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BucketList() {
  const [items, setItems] = useState([
    { id: 1, text: 'Nandi Hills', type: 'activity', completed: false, scheduledDate: null },
    { id: 2, text: 'Museum of Music', type: 'place', completed: false, scheduledDate: null },
    { id: 3, text: 'Wonderla', type: 'activity', completed: false, scheduledDate: null },
  ]);

  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState('activity');

  const [selectedDate, setSelectedDate] = useState('');
  const [chosenEventForDay, setChosenEventForDay] = useState(null);
  const [listFilter, setListFilter] = useState('all'); // all | activity | place

  const [isSpinning, setIsSpinning] = useState(false);
  const [isHandlePulled, setIsHandlePulled] = useState(false);
  const [slotDisplayWord, setSlotDisplayWord] = useState('???');
  const [showResultCard, setShowResultCard] = useState(false);
  const [removeOnComplete, setRemoveOnComplete] = useState(false);

  const [emojis, setEmojis] = useState([]);

  useEffect(() => {
    const emojiPool = ['✈️', '🏔️', '🎒', '🗺️', '🎰', '🎯', '🌊', '📸'];
    const initialEmojis = Array.from({ length: 15 }, (_, i) => ({
      id: `init-${i}`, char: emojiPool[Math.floor(Math.random() * emojiPool.length)],
      left: Math.random() * 100, delay: Math.random() * -20,
      duration: 10 + Math.random() * 15, size: 16 + Math.random() * 24
    }));
    setEmojis(initialEmojis);

    const interval = setInterval(() => {
      setEmojis((prev) => {
        const kept = prev.filter((e) => !e.isDead);
        const updated = kept.map(e => (Date.now() - e.bornAt > 25000) ? { ...e, isDead: true } : e).filter(e => !e.isDead);
        return [...updated, {
          id: Date.now() + Math.random(), char: emojiPool[Math.floor(Math.random() * emojiPool.length)],
          left: Math.random() * 100, delay: 0, duration: 12 + Math.random() * 12,
          size: 16 + Math.random() * 24, bornAt: Date.now()
        }];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setItems([...items, { id: Date.now(), text: newText, type: newType, completed: false, scheduledDate: null }]);
    setNewText('');
  };

  const handleToggleComplete = (id) => {
    if (removeOnComplete) setItems(items.filter(item => item.id !== id));
    else setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleDeleteItem = (id) => setItems(items.filter(item => item.id !== id));

  const handleScheduleRandomEvent = () => {
    if (!selectedDate) { alert("Please select a date from the calendar first!"); return; }
    const availableEvents = items.filter(item => !item.completed && !item.scheduledDate);
    if (availableEvents.length === 0) { alert("No available activities left to schedule! Add more items to your bucket list."); return; }

    setIsHandlePulled(true);
    setTimeout(() => {
      setIsHandlePulled(false);
      setIsSpinning(true);
      setShowResultCard(false);

      const spinDuration = 2200;
      const tickInterval = 80;
      let elapsed = 0;

      const spinner = setInterval(() => {
        const tempIndex = Math.floor(Math.random() * availableEvents.length);
        setSlotDisplayWord(availableEvents[tempIndex].text);
        elapsed += tickInterval;

        if (elapsed >= spinDuration) {
          clearInterval(spinner);
          const finalIndex = Math.floor(Math.random() * availableEvents.length);
          const randomPick = availableEvents[finalIndex];

          setItems(prevItems => prevItems.map(item => item.id === randomPick.id ? { ...item, scheduledDate: selectedDate } : item));
          setSlotDisplayWord(randomPick.text);
          setChosenEventForDay({ text: randomPick.text, date: selectedDate, type: randomPick.type });
          setIsSpinning(false);
          setShowResultCard(true);
        }
      }, tickInterval);
    }, 400);
  };

  const closeSlotMachineOverlay = () => {
    setChosenEventForDay(null);
    setShowResultCard(false);
    setSlotDisplayWord('???');
  };

  const scheduledDateKeys = new Set(items.filter(i => i.scheduledDate).map(i => i.scheduledDate));
  const visibleItems = items.filter(i => listFilter === 'all' || i.type === listFilter);

  return (
    <div style={styles.container}>
      <style>{`
        body, html { margin: 0; padding: 0; background-color: #090d16; min-height: 100vh; }
        @keyframes emojiRainAnimation { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; } 10% { opacity: 0.6; } 90% { opacity: 0.6; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
        @keyframes shakeReel { 0% { transform: translateY(-3px); } 100% { transform: translateY(3px); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pullLever { 0% { transform: rotateX(0deg); } 50% { transform: rotateX(65deg); } 100% { transform: rotateX(0deg); } }
        .bucket-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
        @media (max-width: 800px) { .bucket-layout { grid-template-columns: 1fr; } }
      `}</style>

      <div style={styles.emojiDropZone}>
        {emojis.map((emoji) => (
          <span key={emoji.id} style={{
            position: 'absolute', top: 0, left: `${emoji.left}%`, fontSize: `${emoji.size}px`,
            animationName: 'emojiRainAnimation', animationDuration: `${emoji.duration}s`,
            animationTimingFunction: 'linear', animationDelay: `${emoji.delay}s`,
            animationIterationCount: 'infinite', pointerEvents: 'none', userSelect: 'none'
          }}>{emoji.char}</span>
        ))}
      </div>

      <div style={styles.pageWrapper}>
        <h2 style={styles.title}>🎯 Bucket List Roulette</h2>
        <p style={styles.subtitle}>Lock in your adventures and let the machine schedule your next outing!</p>

        <div className="bucket-layout">
          {/* LEFT: Add Adventure */}
          <div style={styles.leftPanel}>
            <h3 style={styles.sectionHeader}>✨ Add New Adventure</h3>
            <form onSubmit={handleAddItem} style={styles.form}>
              <input
                type="text"
                placeholder="What to do or where to go?"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                style={styles.input}
                required
              />
              <select value={newType} onChange={(e) => setNewType(e.target.value)} style={styles.select}>
                <option value="activity">🏃‍♂️ Activity</option>
                <option value="place">📍 Place to Visit</option>
              </select>
              <button type="submit" style={styles.addButton}>Add Item</button>
            </form>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={removeOnComplete} onChange={(e) => setRemoveOnComplete(e.target.checked)} style={{ accentColor: '#10b981' }} />
              Auto-remove items upon completion
            </label>
          </div>

          {/* RIGHT: Calendar + Explore, then full list */}
          <div>
            <div style={styles.calendarRow}>
              <MonthCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} scheduledDateKeys={scheduledDateKeys} />

              <div style={styles.exploreCard}>
                <h3 style={styles.sectionHeaderPurple}>📅 Planning Roulette</h3>
                <p style={styles.miniText}>
                  {selectedDate ? <>Selected: <strong style={{ color: '#fff' }}>{selectedDate}</strong></> : 'Pick a date on the calendar, then spin!'}
                </p>
                <button onClick={handleScheduleRandomEvent} style={styles.randomButton}>🎰 Explore!!</button>
              </div>
            </div>

            <div style={styles.listPanel}>
              <div style={styles.listHeaderRow}>
                <h3 style={{ ...styles.sectionHeader, margin: 0 }}>🗂️ Your List</h3>
                <div style={styles.filterTabs}>
                  {['all', 'activity', 'place'].map(f => (
                    <button
                      key={f}
                      onClick={() => setListFilter(f)}
                      style={{ ...styles.filterTab, background: listFilter === f ? '#38bdf8' : 'transparent', color: listFilter === f ? '#0f172a' : '#94a3b8' }}
                    >
                      {f === 'all' ? 'All' : f === 'activity' ? 'Activities' : 'Places'}
                    </button>
                  ))}
                </div>
              </div>

              <ul style={styles.list}>
                {visibleItems.length === 0 && <p style={{ color: '#64748b', fontSize: '13px' }}>Nothing here yet — add an adventure on the left!</p>}
                {visibleItems.map(item => (
                  <ListItem key={item.id} item={item} onToggle={handleToggleComplete} onDelete={handleDeleteItem} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {(isSpinning || showResultCard || isHandlePulled) && (
        <div style={styles.slotOverlay}>
          <div style={styles.slotRigWrapper}>
            <div style={styles.slotMachineFrame}>
              <div style={styles.slotHeader}>🎰 DESTINATION CASINO 🎰</div>
              <div style={{ ...styles.slotReelContainer, animation: isSpinning ? 'shakeReel 0.08s infinite alternate' : 'none' }}>
                <div style={{ ...styles.slotTextDisplay, filter: isSpinning ? 'blur(4px)' : 'none', color: showResultCard ? '#67e8f9' : '#fef08a' }}>
                  {slotDisplayWord}
                </div>
              </div>
              {showResultCard && chosenEventForDay && (
                <div style={{ ...styles.confirmationBlock, animation: 'fadeIn 0.3s ease-out' }}>
                  <h4 style={styles.lockedTitle}>🗓️ TARGET DATE LOCKED IN!</h4>
                  <p style={styles.lockedSubtitle}>On <strong style={{ color: '#fff' }}>{chosenEventForDay.date}</strong>, the crew is executing:</p>
                  <button onClick={closeSlotMachineOverlay} style={styles.closeAlertBtn}>Got it, calendar marked! 👍</button>
                </div>
              )}
            </div>
            <div style={styles.leverAssembly}>
              <div style={styles.leverBaseConnector} />
              <div style={{ ...styles.leverArmShaft, animation: isHandlePulled ? 'pullLever 0.4s ease-in-out' : 'none' }}>
                <div style={styles.leverBallKnob} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListItem({ item, onToggle, onDelete }) {
  return (
    <li style={{ ...styles.listItem, borderColor: item.completed ? '#334155' : '#475569', background: item.completed ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.75)' }}>
      <div style={styles.itemLeft} onClick={() => onToggle(item.id)}>
        <input type="checkbox" checked={item.completed} onChange={() => onToggle(item.id)} style={{ ...styles.checkbox, accentColor: '#10b981' }} />
        <div>
          <span style={{ ...styles.itemText, textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#64748b' : '#f8fafc' }}>
            {item.type === 'activity' ? '🏃‍♂️' : '📍'} {item.text}
          </span>
          {item.scheduledDate && <div style={styles.itemDate}>📆 Scheduled: <strong>{item.scheduledDate}</strong></div>}
        </div>
      </div>
      <button onClick={() => onDelete(item.id)} style={styles.deleteBtn}>🗑️</button>
    </li>
  );
}

const styles = {
  container: { position: 'relative', width: '100%', minHeight: '100vh', padding: '3rem 16px', boxSizing: 'border-box', backgroundColor: '#090d16', overflowY: 'auto' },
  emojiDropZone: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' },
  pageWrapper: { position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' },

  title: { margin: '0 0 8px 0', textAlign: 'center', color: '#ffffff', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' },
  subtitle: { color: '#94a3b8', fontSize: '14px', marginBottom: '2rem', textAlign: 'center', lineHeight: '1.5' },

  leftPanel: { background: 'rgba(30, 41, 59, 0.75)', backdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', height: 'fit-content' },
  sectionHeader: { margin: '0 0 14px 0', fontSize: '15px', color: '#38bdf8', fontWeight: '700', letterSpacing: '0.5px' },
  sectionHeaderPurple: { margin: '0 0 6px 0', fontSize: '15px', color: '#c084fc', fontWeight: '700', letterSpacing: '0.5px' },
  miniText: { margin: '0 0 14px 0', fontSize: '13px', color: '#94a3b8' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.2rem' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', outline: 'none' },
  select: { padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  addButton: { padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  checkboxLabel: { fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', lineHeight: '1.4' },

  calendarRow: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '1.5rem' },
  calendarBox: { background: 'rgba(30, 41, 59, 0.75)', backdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.2rem', flex: '1 1 260px', minWidth: '260px' },
  calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  calendarNavBtn: { background: '#0f172a', border: '1px solid #334155', color: '#fff', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' },
  calendarTitle: { color: '#fff', fontWeight: '700', fontSize: '14px' },
  calendarWeekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' },
  calendarWeekday: { textAlign: 'center', color: '#64748b', fontSize: '11px', fontWeight: '600' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' },
  calendarDay: { position: 'relative', background: 'transparent', border: 'none', color: '#e2e8f0', borderRadius: '8px', height: '32px', cursor: 'pointer', fontSize: '13px' },
  eventDot: { position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%' },

  exploreCard: { background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(192, 132, 252, 0.2)', padding: '1.2rem', borderRadius: '20px', flex: '1 1 220px', minWidth: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  randomButton: { padding: '14px 20px', backgroundColor: '#a855f7', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },

  listPanel: { background: 'rgba(30, 41, 59, 0.75)', backdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.2rem' },
  listHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' },
  filterTabs: { display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '10px', border: '1px solid #334155' },
  filterTab: { padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },

  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', border: '1px solid', borderRadius: '10px', marginBottom: '10px' },
  itemLeft: { display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1 },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
  itemText: { fontSize: '15px', fontWeight: '500' },
  itemDate: { fontSize: '12px', color: '#a855f7', marginTop: '4px', fontWeight: '600' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: 0.7 },

  slotOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(7, 10, 19, 0.95)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(12px)' },
  slotRigWrapper: { display: 'flex', alignItems: 'center', position: 'relative', paddingRight: '55px', boxSizing: 'border-box' },
  slotMachineFrame: { background: '#1e293b', border: '5px solid #f59e0b', borderRadius: '24px', padding: '30px', width: '360px', boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 0 40px rgba(245, 158, 11, 0.4)', position: 'relative', zIndex: 2 },
  slotHeader: { fontSize: '18px', fontWeight: '900', color: '#f59e0b', marginBottom: '20px', letterSpacing: '1px' },
  slotReelContainer: { background: '#090d16', border: '3px solid #475569', borderRadius: '14px', padding: '40px 15px', margin: '15px 0', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)' },
  slotTextDisplay: { fontSize: '26px', fontWeight: '900', letterSpacing: '0.5px' },
  leverAssembly: { position: 'absolute', right: '10px', top: '42%', display: 'flex', alignItems: 'center', zIndex: 1 },
  leverBaseConnector: { width: '20px', height: '40px', background: '#475569', borderRadius: '5px 0 0 5px', boxShadow: 'inset -2px 2px 4px rgba(0,0,0,0.4)' },
  leverArmShaft: { width: '12px', height: '90px', background: 'linear-gradient(to bottom, #94a3b8, #cbd5e1, #475569)', transformOrigin: 'bottom center', position: 'relative', borderRadius: '4px' },
  leverBallKnob: { width: '36px', height: '36px', backgroundColor: '#ef4444', borderRadius: '50%', position: 'absolute', top: '-28px', left: '-12px', boxShadow: '0 6px 12px rgba(0,0,0,0.4), inset -4px -4px 8px rgba(0,0,0,0.4)' },
  confirmationBlock: { marginTop: '25px', padding: '18px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '14px' },
  lockedTitle: { color: '#10b981', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px' },
  lockedSubtitle: { color: '#94a3b8', fontSize: '13px', margin: '0 0 15px 0' },
  closeAlertBtn: { width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }
};