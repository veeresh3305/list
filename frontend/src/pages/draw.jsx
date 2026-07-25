import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Upload, Clock, Sparkles, Flame, 
  RefreshCw, ChevronRight, Award, AlertTriangle, Image as ImageIcon, User
} from 'lucide-react';
import io from 'socket.io-client';

 const loadingMessages = [
    'Comparing stroke geometry...',
    'Evaluating shape ratios & scale...',
    'Analyzing shading & detail density...',
    'Generating final AI evaluation score...'
  ];

export default function DrawChallenge({ username = "Player1" }) {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [activeTab, setActiveTab] = useState('challenge');

  // Backend Sync State
  const [prompt, setPrompt] = useState(null);
  const [promptError, setPromptError] = useState(null);
  const [scoreError, setScoreError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('24h 00m 00s');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Results & Leaderboard Data
  const [userScoreData, setUserScoreData] = useState(null);
  const [matchupData, setMatchupData] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ today: [], thisWeek: [] });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let interval;
    if (isScoring) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isScoring]);
 

  // Initialize Socket Connection & Listeners
  useEffect(() => {
    const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Send the logged in username immediately on init
    newSocket.emit('init_draw_challenge', { username });

    newSocket.on('prompt_data', (data) => {
      setPrompt(data);
      setPromptError(null);
    });

    newSocket.on('prompt_error', (data) => {
      setPromptError(data.message);
    });

    newSocket.on('score_error', (data) => {
      setIsScoring(false);
      setScoreError(data.message);
    });

    newSocket.on('time_update', (timeStr) => {
      setTimeRemaining(timeStr);
    });

    newSocket.on('score_calculated', (result) => {
      setIsScoring(false);
      setScoreError(null);
      // Ensure local username is preserved in score data
      setUserScoreData({ ...result, username: result?.username || username });
      setCurrentScreen(4); // Move to Results
    });

    newSocket.on('matchup_update', (data) => {
      setMatchupData(data);
    });

    newSocket.on('leaderboard_update', (data) => {
      setLeaderboard(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  // Rotate scoring loading messages
  useEffect(() => {
    let interval;
    if (isScoring) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isScoring]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScoringProcess = () => {
    if (!uploadedImage || !socket) return;
    setIsScoring(true);
    setScoreError(null);

    socket.emit('submit_drawing', {
      username,
      image: uploadedImage,
      promptId: prompt?.id
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 bg-slate-950 text-slate-100 min-h-screen font-sans border-x border-slate-800/60 shadow-2xl">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              AI Drawing Arena
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            Logged in as <span className="text-cyan-300 font-bold underline underline-offset-2">{username}</span>
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => { setActiveTab('challenge'); setCurrentScreen(1); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'challenge' 
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            Challenge
          </button>
          <button
            onClick={() => { setActiveTab('leaderboard'); setCurrentScreen(6); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'leaderboard' 
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {promptError && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-500/40 text-red-200 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{promptError}</p>
        </div>
      )}

      {/* Dynamic Screen Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {currentScreen === 1 && (
            <ScreenOverview 
              prompt={prompt} 
              timeRemaining={timeRemaining}
              disabled={!!promptError}
              onStart={() => setCurrentScreen(2)} 
            />
          )}

          {currentScreen === 2 && (
            <ScreenPrompt 
              prompt={prompt} 
              onNext={() => setCurrentScreen(3)} 
            />
          )}

          {currentScreen === 3 && (
            <ScreenUpload 
              uploadedImage={uploadedImage} 
              onImageUpload={handleImageUpload} 
              onSubmit={startScoringProcess}
              isScoring={isScoring}
              scoreError={scoreError}
              loadingMessage={loadingMessages[loadingMessageIndex]}
            />
          )}

          {currentScreen === 4 && (
            <ScreenResults 
              scoreData={userScoreData} 
              username={username}
              onViewComparison={() => setCurrentScreen(5)} 
            />
          )}

          {currentScreen === 5 && (
            <ScreenComparison 
              username={username}
              userImage={uploadedImage} 
              matchupData={matchupData}
            />
          )}

          {currentScreen === 6 && (
            <ScreenLeaderboard leaderboard={leaderboard} currentUsername={username} />
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}

// ==========================================
// SUB-SCREEN COMPONENTS
// ==========================================

function ScreenOverview({ prompt, timeRemaining, disabled, onStart }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/30 inline-block mb-3">
              {prompt?.category || 'Daily Topic'}
            </span>
            <h3 className="text-2xl font-black text-slate-50 tracking-tight">
              Draw a {prompt?.title || 'Loading prompt...'}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/90 px-3.5 py-2 rounded-xl border border-slate-800 text-cyan-400 font-bold shadow-inner">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{timeRemaining}</span>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mt-4">
          {prompt?.description || 'Pick up your pencil, paper, or digital stylus and bring today’s reference drawing to life!'}
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4 backdrop-blur-sm">
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">How scoring works</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Upload your completed artwork. Our AI vision system analyzes geometry, proportion, accuracy, and detail balance against reference benchmarks.
          </p>
        </div>
      </div>

      <button 
        onClick={onStart}
        disabled={disabled}
        className={`w-full py-4 px-6 font-black rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm tracking-wide ${
          disabled 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
            : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 shadow-cyan-500/20 active:scale-[0.99]'
        }`}
      >
        <span>View Challenge Reference</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function ScreenPrompt({ prompt, onNext }) {
  // Fix reference URL lookup (supports both camelCase and snake_case backend keys)
  const imageUrl = prompt?.referenceUrl || prompt?.reference_url || prompt?.imageUrl || prompt?.image_url;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-xs font-black uppercase tracking-widest text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-3.5 py-1 rounded-full">
          Today's Challenge
        </span>
        <h2 className="text-3xl font-black text-slate-50 mt-3">
          Draw a {prompt?.title || 'Subject'}
        </h2>
      </div>

      <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl group flex items-center justify-center">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={prompt?.title || "Reference image"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
            <ImageIcon className="w-12 h-12 text-slate-600" />
            <p className="text-sm text-slate-400 font-medium">
              Reference image photo standard preview
            </p>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700">
            Reference Illustration
          </span>
        </div>
      </div>

      <button 
        onClick={onNext}
        className="w-full py-4 bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-black rounded-2xl shadow-lg shadow-cyan-500/20 transition-all text-sm tracking-wide active:scale-[0.99]"
      >
        I'm Ready to Upload My Drawing
      </button>
    </div>
  );
}

function ScreenUpload({ uploadedImage, onImageUpload, onSubmit, isScoring, scoreError, loadingMessage }) {
  if (isScoring) {
    return (
      <div className="py-24 text-center space-y-6 bg-slate-900/40 border border-slate-800 rounded-3xl">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-16 h-16 border-4 border-slate-800 border-t-cyan-400 rounded-full mx-auto"
        />
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-100">AI Scoring in Progress</h3>
          <p className="text-xs font-semibold text-cyan-400 animate-pulse">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-50">Upload Your Artwork</h2>
        <p className="text-xs text-slate-400 mt-1">Ensure good lighting and minimal shadows for best score accuracy.</p>
      </div>

      {scoreError && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 text-red-200 rounded-2xl text-xs text-center font-medium">
          {scoreError}
        </div>
      )}

      <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 transition-colors rounded-3xl bg-slate-900/40 p-6 text-center relative overflow-hidden backdrop-blur-sm">
        {uploadedImage ? (
          <div className="space-y-4">
            <img 
              src={uploadedImage} 
              alt="Uploaded drawing preview" 
              className="max-h-72 mx-auto rounded-2xl border border-slate-800 object-contain shadow-2xl"
            />
            <div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 cursor-pointer hover:text-cyan-300 bg-cyan-950/60 px-4 py-2 rounded-xl border border-cyan-500/30">
                <RefreshCw className="w-3.5 h-3.5" /> Replace Image
                <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer block space-y-4 py-12">
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-200">Click to choose image or drag & drop</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, or JPEG file format</p>
            </div>
            <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
          </label>
        )}
      </div>

      <button 
        disabled={!uploadedImage}
        onClick={onSubmit}
        className={`w-full py-4 font-black rounded-2xl transition-all text-sm tracking-wide ${
          uploadedImage 
            ? 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-[0.99]' 
            : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
        }`}
      >
        Submit for AI Evaluation
      </button>
    </div>
  );
}

function ScreenResults({ scoreData, username, onViewComparison }) {
  if (!scoreData) return null;

  return (
    <div className="space-y-6">
      {scoreData.isLeader && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-bold shadow-lg">
            <Award className="w-4 h-4 text-amber-400" /> Currently #1 on the Leaderboard!
          </span>
        </div>
      )}

      <div className="text-center space-y-2 bg-slate-900/60 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Overall AI Score</p>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 tracking-tight">
          {scoreData.totalScore} <span className="text-2xl text-slate-500 font-medium">/ 100</span>
        </div>
        <p className="text-xs text-slate-300 font-semibold mt-1">
          Artist: <span className="text-cyan-400 font-bold">{username}</span>
        </p>
      </div>

      {scoreData.breakdown && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score Breakdown</h4>
          <div className="space-y-3">
            {Object.entries(scoreData.breakdown).map(([key, val]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300 capitalize">{key}</span>
                  <span className="text-cyan-400 font-bold">{val}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-teal-400 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${val}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scoreData.feedback && (
        <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Sparkles className="w-4 h-4 text-cyan-400" /> AI Feedback
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">{scoreData.feedback}</p>
        </div>
      )}

      <button 
        onClick={onViewComparison}
        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold rounded-2xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 text-sm"
      >
        <span>Compare with Matchups</span> 
        <ChevronRight className="w-4 h-4 text-cyan-400" />
      </button>
    </div>
  );
}

function ScreenComparison({ username, userImage, matchupData }) {
  const opponent = matchupData?.opponent;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-50">Head-to-Head Comparison</h2>
        <p className="text-xs text-slate-400 mt-1">Matchup evaluation against other contestants</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current User */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-4 space-y-4 shadow-xl">
          <div className="aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
            <img src={userImage} alt={username} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
              You
            </div>
          </div>
          <div className="flex justify-between items-center px-1">
            <p className="text-sm font-bold text-slate-100 truncate">{username}</p>
            <p className="text-xl font-black text-cyan-400">{matchupData?.userScore ?? '--'} <span className="text-xs font-normal text-slate-500">pts</span></p>
          </div>
        </div>

        {/* Opponent */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
          <div className="aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
            {opponent?.image ? (
              <img src={opponent.image} alt={opponent.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4 gap-2">
                <User className="w-8 h-8 text-slate-700" />
                <span>Waiting for next contestant match...</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center px-1">
            <p className="text-sm font-bold text-slate-100 truncate">{opponent?.username || 'Opponent'}</p>
            <p className="text-xl font-black text-cyan-400">{opponent?.score ? `${opponent.score} pts` : 'Pending'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenLeaderboard({ leaderboard, currentUsername }) {
  const [subTab, setSubTab] = useState('today');
  const rows = (subTab === 'today' ? leaderboard?.today : leaderboard?.thisWeek) || [];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setSubTab('today')}
          className={`pb-3 px-6 text-xs font-bold transition-all relative ${
            subTab === 'today' ? 'text-cyan-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Today's Standings
          {subTab === 'today' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>
        <button 
          onClick={() => setSubTab('thisWeek')}
          className={`pb-3 px-6 text-xs font-bold transition-all relative ${
            subTab === 'thisWeek' ? 'text-cyan-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Weekly Leaders
          {subTab === 'thisWeek' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>
      </div>

      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">No submissions recorded for this period yet.</p>
          </div>
        ) : (
          rows.map((item, idx) => {
            const isSelf = item.username === currentUsername;

            return (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                  isSelf 
                    ? 'bg-cyan-950/40 border border-cyan-500/40 shadow-lg' 
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`text-xs font-black w-6 text-center ${
                    idx === 0 ? 'text-amber-400 text-sm' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {item.username}
                      {isSelf && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Flame className="w-3 h-3 text-amber-500" /> {item.streak || 1} day streak
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-cyan-400">{item.score} <span className="text-[10px] text-slate-500">pts</span></span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}