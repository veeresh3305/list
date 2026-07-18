import React, { useState, useEffect } from 'react';

export default function BucketList() {
  // Main list state
  const [items, setItems] = useState([
    { id: 1, text: 'Nandi Hills', type: 'activity', completed: false, scheduledDate: null },
    { id: 2, text: 'Museum of Music', type: 'place', completed: false, scheduledDate: null },
    { id: 3, text: 'Wonderla', type: 'activity', completed: false, scheduledDate: null },
  ]);

  // Form States
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState('activity'); 

  // Scheduling States
  const [selectedDate, setSelectedDate] = useState('');
  const [chosenEventForDay, setChosenEventForDay] = useState(null);

  // Slot Machine Mechanism States
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHandlePulled, setIsHandlePulled] = useState(false);
  const [slotDisplayWord, setSlotDisplayWord] = useState('???');
  const [showResultCard, setShowResultCard] = useState(false);

  // Settings state
  const [removeOnComplete, setRemoveOnComplete] = useState(false);

  // Falling Emojis State
  const [emojis, setEmojis] = useState([]);

  // Generate Falling Emojis Continuously
  useEffect(() => {
    const emojiPool = ['✈️', '🏔️', '🎒', '🗺️', '🎰', '🎯', '🌊', '📸'];
    
    // Seed initial batch so the page isn't empty on load
    const initialEmojis = Array.from({ length: 15 }, (_, i) => ({
      id: `init-${i}`,
      char: emojiPool[Math.floor(Math.random() * emojiPool.length)],
      left: Math.random() * 100,
      delay: Math.random() * -20, // Negative delay means they start mid-air
      duration: 10 + Math.random() * 15,
      size: 16 + Math.random() * 24
    }));
    setEmojis(initialEmojis);

    const interval = setInterval(() => {
      setEmojis((prev) => {
        // Keep array clean by cycling old ones out
        const kept = prev.filter((e) => !e.isDead);
        const updated = kept.map(e => {
          // Mark ones that have been running longer than 25s to clear them
          if (Date.now() - e.bornAt > 25000) return { ...e, isDead: true };
          return e;
        }).filter(e => !e.isDead);

        return [
          ...updated,
          {
            id: Date.now() + Math.random(),
            char: emojiPool[Math.floor(Math.random() * emojiPool.length)],
            left: Math.random() * 100,
            delay: 0,
            duration: 12 + Math.random() * 12,
            size: 16 + Math.random() * 24,
            bornAt: Date.now()
          }
        ];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Add Item Handler
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newItem = {
      id: Date.now(),
      text: newText,
      type: newType,
      completed: false,
      scheduledDate: null 
    };

    setItems([...items, newItem]);
    setNewText('');
  };

  const handleToggleComplete = (id) => {
    if (removeOnComplete) {
      setItems(items.filter(item => item.id !== id));
    } else {
      setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    }
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Slot Machine Engine Handler 🎰
  const handleScheduleRandomEvent = (e) => {
    e.preventDefault();
    
    if (!selectedDate) {
      alert("Please select a date from the calendar first!");
      return;
    }

    const availableEvents = items.filter(item => !item.completed && !item.scheduledDate);
    
    if (availableEvents.length === 0) {
      alert("No available activities left to schedule! Add more items to your bucket list.");
      return;
    }

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

          setItems(prevItems => prevItems.map(item => 
            item.id === randomPick.id ? { ...item, scheduledDate: selectedDate } : item
          ));

          setSlotDisplayWord(randomPick.text);
          setChosenEventForDay({
            text: randomPick.text,
            date: selectedDate,
            type: randomPick.type
          });

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

  return (
    <div style={styles.container}>
      {/* GLOBAL CORE STYLESHEET INJECTIONS */}
      <style>{`
        body, html {
          margin: 0;
          padding: 0;
          background-color: #090d16;
          min-height: 100vh;
        }
        @keyframes emojiRainAnimation {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes shakeReel {
          0% { transform: translateY(-3px); }
          100% { transform: translateY(3px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pullLever {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(65deg); }
          100% { transform: rotateX(0deg); }
        }
      `}</style>

      {/* BACKGROUND FLOOD DROP ZONE */}
      <div style={styles.emojiDropZone}>
        {emojis.map((emoji) => (
          <span
            key={emoji.id}
            style={{
              position: 'absolute',
              top: 0,
              left: `${emoji.left}%`,
              fontSize: `${emoji.size}px`,
              animationName: 'emojiRainAnimation',
              animationDuration: `${emoji.duration}s`,
              animationTimingFunction: 'linear',
              animationDelay: `${emoji.delay}s`,
              animationIterationCount: 'infinite',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {emoji.char}
          </span>
        ))}
      </div>

      {/* FOREGROUND APPLICATION CORE WRAPPER */}
      <div style={styles.contentCardFrame}>
        <h2 style={styles.title}>🎯 Bucket List Roulette</h2>
        <p style={styles.subtitle}>Lock in your adventures and let the machines organize your calendar updates!</p>

        {/* --- 1. ADD ITEM SECTION --- */}
        <form onSubmit={handleAddItem} style={styles.form}>
          <h3 style={styles.sectionHeader}>✨ Add New Adventure</h3>
          <input
            type="text"
            placeholder="What to do or where to go?"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            style={styles.input}
            required
          />
          
          <div style={styles.formRow}>
            <select value={newType} onChange={(e) => setNewType(e.target.value)} style={styles.select}>
              <option value="activity">🏃‍♂️ Activity</option>
              <option value="place">📍 Place to Visit</option>
            </select>
            <button type="submit" style={styles.addButton}>Add Item</button>
          </div>
        </form>

        {/* --- 2. RANDOMIZER & CALENDAR BLOCK --- */}
        <div style={styles.schedulerBlock}>
          <h3 style={styles.sectionHeaderPurple}>📅 Planning Roulette</h3>
          <p style={styles.miniText}>Pick a target date, and run the reel to extract a priority choice!</p>
          
          <div style={styles.schedulerRow}>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              style={styles.dateInput}
            />
            <button onClick={handleScheduleRandomEvent} style={styles.randomButton}>
              🎰 Explore!!
            </button>
          </div>
        </div>

        {/* --- LIST CONTROLS --- */}
        <div style={{ margin: '1.5rem 0 1rem 0' }}>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={removeOnComplete} 
              onChange={(e) => setRemoveOnComplete(e.target.checked)} 
              style={{accentColor: '#10b981'}}
            />
            Auto-remove items upon completion
          </label>
        </div>

        {/* --- DISPLAY LISTS --- */}
        <h3 style={styles.listHeading}>🏃‍♂️ Activities</h3>
        <ul style={styles.list}>
          {items.filter(i => i.type === 'activity').map(item => (
            <ListItem key={item.id} item={item} onToggle={handleToggleComplete} onDelete={handleDeleteItem} />
          ))}
        </ul>

        <h3 style={styles.listHeading}>📍 Places</h3>
        <ul style={styles.list}>
          {items.filter(i => i.type === 'place').map(item => (
            <ListItem key={item.id} item={item} onToggle={handleToggleComplete} onDelete={handleDeleteItem} />
          ))}
        </ul>
      </div>

      {/* --- 3. FIXED CENTRIC SLOT MACHINE MODAL OVERLAY --- */}
      {(isSpinning || showResultCard || isHandlePulled) && (
        <div style={styles.slotOverlay}>
          <div style={styles.slotRigWrapper}>
            
            <div style={styles.slotMachineFrame}>
              <div style={styles.slotHeader}>🎰 DESTINATION CASINO 🎰</div>
              
              <div style={{
                ...styles.slotReelContainer,
                animation: isSpinning ? 'shakeReel 0.08s infinite alternate' : 'none'
              }}>
                <div style={{
                  ...styles.slotTextDisplay,
                  filter: isSpinning ? 'blur(4px)' : 'none',
                  color: showResultCard ? '#67e8f9' : '#fef08a'
                }}>
                  {slotDisplayWord}
                </div>
              </div>

              {showResultCard && chosenEventForDay && (
                <div style={{...styles.confirmationBlock, animation: 'fadeIn 0.3s ease-out'}}>
                  <h4 style={styles.lockedTitle}>🗓️ TARGET DATE LOCKED IN!</h4>
                  <p style={styles.lockedSubtitle}>On <strong style={{color: '#fff'}}>{chosenEventForDay.date}</strong>, the crew is executing:</p>
                  <button onClick={closeSlotMachineOverlay} style={styles.closeAlertBtn}>
                    Got it, calendar marked! 👍
                  </button>
                </div>
              )}
            </div>

            {/* MECHANICAL ARM LEVER ASSEMBLE */}
            <div style={styles.leverAssembly}>
              <div style={styles.leverBaseConnector} />
              <div style={{
                ...styles.leverArmShaft,
                animation: isHandlePulled ? 'pullLever 0.4s ease-in-out' : 'none'
              }}>
                <div style={styles.leverBallKnob} />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Item Sub-component
function ListItem({ item, onToggle, onDelete }) {
  return (
    <li style={{
      ...styles.listItem,
      borderColor: item.completed ? '#334155' : '#475569',
      background: item.completed ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.75)'
    }}>
      <div style={styles.itemLeft} onClick={() => onToggle(item.id)}>
        <input 
          type="checkbox" 
          checked={item.completed} 
          onChange={() => onToggle(item.id)} 
          style={{...styles.checkbox, accentColor: '#10b981'}} 
        />
        <div>
          <span style={{
            ...styles.itemText,
            textDecoration: item.completed ? 'line-through' : 'none',
            color: item.completed ? '#64748b' : '#f8fafc'
          }}>
            {item.text}
          </span>
          {item.scheduledDate && (
            <div style={styles.itemDate}>📆 Scheduled: <strong>{item.scheduledDate}</strong></div>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(item.id)} style={styles.deleteBtn}>🗑️</button>
    </li>
  );
}

// Styling Object
const styles = {
  container: { position: 'relative', width: '100%', minHeight: '100vh', padding: '3rem 16px', boxSizing: 'border-box', backgroundColor: '#090d16', overflowY: 'auto' },
  
  // Immersive Full View Rain Grid
  emojiDropZone: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' },
  
  contentCardFrame: { position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', padding: '2.5rem 2rem', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(24px)', webkitBackdropFilter: 'blur(24px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' },
  
  title: { margin: '0 0 8px 0', textAlign: 'center', color: '#ffffff', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' },
  subtitle: { color: '#94a3b8', fontSize: '14px', marginBottom: '2.5rem', textAlign: 'center', lineHeight: '1.5' },
  sectionHeader: { margin: '0 0 12px 0', fontSize: '15px', color: '#38bdf8', fontWeight: '700', letterSpacing: '0.5px' },
  sectionHeaderPurple: { margin: '0 0 6px 0', fontSize: '15px', color: '#c084fc', fontWeight: '700', letterSpacing: '0.5px' },
  miniText: { margin: '0 0 14px 0', fontSize: '13px', color: '#94a3b8' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.04)' },
  formRow: { display: 'flex', gap: '12px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', outline: 'none', flex: 2 },
  select: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', cursor: 'pointer' },
  addButton: { padding: '12px 24px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  schedulerBlock: { background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(192, 132, 252, 0.2)', padding: '20px', borderRadius: '14px', marginBottom: '1.5rem' },
  schedulerRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  dateInput: { padding: '12px', borderRadius: '8px', border: '1px solid #a855f7', backgroundColor: '#0f172a', color: '#fff', flex: 1, minWidth: '150px' },
  randomButton: { padding: '12px 20px', backgroundColor: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1, minWidth: '180px', fontSize: '16px' },
  
  /* Dead-Center Full Modal Engine */
  slotOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(7, 10, 19, 0.95)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(12px)', webkitBackdropFilter: 'blur(12px)' },
  slotRigWrapper: { display: 'flex', alignItems: 'center', position: 'relative', paddingRight: '55px', boxSizing: 'border-box' },
  slotMachineFrame: { background: '#1e293b', border: '5px solid #f59e0b', borderRadius: '24px', padding: '30px', width: '360px', boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 0 40px rgba(245, 158, 11, 0.4)', position: 'relative', zIndex: 2 },
  slotHeader: { fontSize: '18px', fontWeight: '900', color: '#f59e0b', marginBottom: '20px', letterSpacing: '1px' },
  slotReelContainer: { background: '#090d16', border: '3px solid #475569', borderRadius: '14px', padding: '40px 15px', margin: '15px 0', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)' },
  slotTextDisplay: { fontSize: '26px', fontWeight: '900', letterSpacing: '0.5px' },
  
  /* Handle Lever Assembly */
  leverAssembly: { position: 'absolute', right: '10px', top: '42%', display: 'flex', alignItems: 'center', zIndex: 1 },
  leverBaseConnector: { width: '20px', height: '40px', background: '#475569', borderRadius: '5px 0 0 5px', boxShadow: 'inset -2px 2px 4px rgba(0,0,0,0.4)' },
  leverArmShaft: { width: '12px', height: '90px', background: 'linear-gradient(to bottom, #94a3b8, #cbd5e1, #475569)', transformOrigin: 'bottom center', position: 'relative', borderRadius: '4px' },
  leverBallKnob: { width: '36px', height: '36px', backgroundColor: '#ef4444', borderRadius: '50%', position: 'absolute', top: '-28px', left: '-12px', boxShadow: '0 6px 12px rgba(0,0,0,0.4), inset -4px -4px 8px rgba(0,0,0,0.4)' },
  
  confirmationBlock: { marginTop: '25px', padding: '18px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '14px' },
  lockedTitle: { color: '#10b981', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px' },
  lockedSubtitle: { color: '#94a3b8', fontSize: '13px', margin: '0 0 15px 0' },
  closeAlertBtn: { width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  
  listHeading: { fontSize: '15px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginTop: '2rem', fontWeight: '700', letterSpacing: '0.5px' },
  list: { listStyle: 'none', padding: 0, marginBottom: '1rem' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', border: '1px solid', borderRadius: '10px', marginBottom: '10px' },
  itemLeft: { display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1 },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
  itemText: { fontSize: '16px', fontWeight: '500' },
  itemDate: { fontSize: '12px', color: '#a855f7', marginTop: '4px', fontWeight: '600' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: 0.7 },
  checkboxLabel: { fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
};