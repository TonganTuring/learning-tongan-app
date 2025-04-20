'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '@/components/Navbar';
import { getSupabaseClient } from '@/utils/supabase/supabase-client';
import { Flashcard } from '@/types/database';
import { bookChapters, codeToBook, bookCodes } from '@/components/BookSelector';
import { PencilIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  newWords: number;
  masteredWords: number;
  vocabularyProgress: number;
  vocabGoal: number;
  currentBook: string;
  currentChapter: number;
  dailyProgress: {
    category: string;
    words: number;
    goal: number;
  }[];
  readingProgress: number;
}

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    newWords: 0,
    masteredWords: 0,
    vocabularyProgress: 0,
    vocabGoal: 0,
    currentBook: '',
    currentChapter: 0,
    dailyProgress: [],
    readingProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<number | ''>('');
  const [goalError, setGoalError] = useState('');

  const CustomXAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
    const dayData = stats.dailyProgress.find((d: { category: string }) => d.category === payload.value);
    const progress = dayData ? Math.min(100, Math.round((dayData.words / dayData.goal) * 100)) : 0;
    const hasActivity = dayData && dayData.words > 0;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={10}>
          {payload.value.slice(0, 3)}
        </text>
        {/* Fire emoji for days with activity */}
        {hasActivity && (
          <text x={0} y={32} textAnchor="middle" fontSize={16}>
            🔥
          </text>
        )}
        {/* Simple circular progress */}
        <circle
          cx={0}
          cy={hasActivity ? 60 : 45}
          r={12}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={2}
        />
        {progress > 0 && (
          <path
            d={`
              M ${0} ${hasActivity ? 60 : 45}
              m -12, 0
              a 12,12 0 1,1 24,0
            `}
            fill="none"
            stroke="#991B1B"
            strokeWidth={2}
            strokeDasharray={`${(progress / 100) * 75.4} 75.4`}
            transform={`rotate(-90 ${0} ${hasActivity ? 60 : 45})`}
          />
        )}
      </g>
    );
  };

  useEffect(() => {
    const calculateStats = async () => {
      if (!user) return;

      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;

        const supabase = await getSupabaseClient(token);

        // Get all flashcards for the user
        const { data: flashcards, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('clerk_user_id', user.id);

        if (error) {
          console.error('Error fetching flashcards:', error);
          throw error;
        }

        // Get user's current book and chapter progress
        const { data: userProgress, error: progressError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .single();

        if (progressError) {
          console.error('Error fetching user progress:', progressError);
          throw progressError;
        }

        // Calculate new words (created in the past week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newWords = flashcards.filter(card => 
          new Date(card.created_at) >= oneWeekAgo
        ).length;

        // Calculate mastered words (status = 'good')
        const masteredWords = flashcards.filter(card => 
          card.status === 'good'
        ).length;

        // Calculate vocabulary progress
        const vocabularyProgress = flashcards.length > 0
          ? Math.round((masteredWords / flashcards.length) * 100)
          : 0;

        // Calculate daily progress
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const dailyProgress = days.map((day, index) => {
          // Get all cards for this day of the week that are marked as 'good'
          const dayCards = flashcards.filter(card => {
            const cardDate = new Date(card.created_at);
            return cardDate.getDay() === index && card.status === 'good';
          });

          // If no cards for this day, return empty progress
          if (dayCards.length === 0) {
            return {
              category: day,
              words: 0,
              goal: userProgress?.vocab_goal || 0
            };
          }

          // Sort cards by date to get the most recent ones
          dayCards.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          // Get the most recent week's cards
          const mostRecentWeekCards = dayCards.filter(card => {
            const cardDate = new Date(card.created_at);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return cardDate >= oneWeekAgo;
          });

          return {
            category: day,
            words: mostRecentWeekCards.length,
            goal: userProgress?.vocab_goal || 0
          };
        });

        // Calculate reading progress
        const bookName = codeToBook[userProgress?.current_book] || userProgress?.current_book || '';
        const totalChapters = bookChapters[bookName] || 0;
        const readingProgress = totalChapters > 0
          ? Math.round((userProgress?.current_chapter / totalChapters) * 100)
          : 0;

        setStats({
          newWords,
          masteredWords,
          vocabularyProgress,
          vocabGoal: userProgress?.vocab_goal || 0,
          currentBook: bookName,
          currentChapter: userProgress?.current_chapter || 0,
          dailyProgress,
          readingProgress
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [user, getToken]);

  const handleUpdateVocabGoal = async () => {
    if (!user) return;
    if (newGoal === '') {
      setGoalError('Please enter a number');
      return;
    }

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const supabase = await getSupabaseClient(token);
      const { error } = await supabase
        .from('users')
        .update({ vocab_goal: newGoal })
        .eq('clerk_id', user.id);

      if (error) throw error;

      setStats(prev => ({ ...prev, vocabGoal: newGoal }));
      setIsEditingGoal(false);
      setGoalError('');
    } catch (error) {
      console.error('Error updating vocab goal:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-pulse text-lg">Loading dashboard...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-4 h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            Malo e lelei {user?.firstName || 'Friend'} 👋
          </h1>
          <p className="text-red-800">Tau ako lea fakatonga</p>
        </div>

        <div className="flex gap-6">
          {/* Left Column - Stats and Progress */}
          <div className="w-2/5 space-y-4">
            {/* Stats Cards Row */}
            <div className="flex gap-2">
              {/* New Words Card */}
              <a 
                href="/study"
                className="bg-white rounded-xl p-4 shadow-sm flex-1 aspect-square flex flex-col justify-center items-center transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="text-4xl font-bold mb-1">{stats.newWords}</div>
                <div className="text-gray-600 text-sm text-center">New Words</div>
              </a>

              {/* Mastered Words Card */}
              <a 
                href="/study"
                className="bg-white rounded-xl p-4 shadow-sm flex-1 aspect-square flex flex-col justify-center items-center transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="text-4xl font-bold mb-1">{stats.masteredWords}</div>
                <div className="text-gray-600 text-sm text-center">Mastered Words</div>
              </a>

              {/* Vocab Goal Card */}
              <div 
                className="bg-white rounded-xl p-4 shadow-sm flex-1 aspect-square flex flex-col justify-center items-center relative transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                onClick={() => {
                  setNewGoal(stats.vocabGoal);
                  setIsEditingGoal(true);
                }}
              >
                <div className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full">
                  <PencilIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.vocabGoal}</div>
                <div className="text-gray-600 text-sm text-center">Vocab Goal</div>
              </div>
            </div>

            {/* Progress Cards */}
            {/* Vocabulary Progress Card */}
            <div className="space-y-4">
              <a 
                href="/study"
                className="block bg-white rounded-xl p-6 shadow-sm transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="mb-4">
                  <div className="text-4xl font-bold text-red-800 mb-2">
                    {stats.vocabularyProgress}%
                  </div>
                  <div className="text-gray-600">Progress in vocabulary</div>
                </div>
                <div className="w-full bg-[#FAF7F2] rounded-full h-2.5">
                  <div 
                    className="bg-red-800 h-2.5 rounded-full" 
                    style={{ width: `${stats.vocabularyProgress}%` }}
                  ></div>
                </div>
              </a>

              {/* Bible Progress Card */}
              <a 
                href={`/bible/${bookCodes[stats.currentBook]}/${stats.currentChapter}`}
                className="block bg-white rounded-xl p-6 shadow-sm transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="mb-4">
                  <div className="text-4xl font-bold text-red-800 mb-2">
                    {stats.readingProgress}%
                  </div>
                  <div className="text-gray-600">
                    Progress in {stats.currentBook}
                  </div>
                </div>
                <div className="w-full bg-[#FAF7F2] rounded-full h-2.5">
                  <div 
                    className="bg-red-800 h-2.5 rounded-full" 
                    style={{ width: `${stats.readingProgress}%` }}
                  ></div>
                </div>
              </a>
            </div>
          </div>

          {/* Right Column - Progress Chart */}
          <div className="w-3/5 bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Daily Word Count</h2>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.dailyProgress}
                  margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#991B1B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#991B1B" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#6B7280' }}
                    interval={0}
                    height={80}
                    tickMargin={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#6B7280' }}
                    width={10}
                    tickMargin={10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'words') return [`${value} words`, 'Words Learned'];
                      if (name === 'goal') return [`${value} words`, 'Goal'];
                      return [value, name];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="words"
                    stroke="#991B1B"
                    fillOpacity={1}
                    fill="url(#colorWords)"
                  />
                  <Area
                    type="monotone"
                    dataKey="goal"
                    stroke="#D1D5DB"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Goal Modal */}
      {isEditingGoal && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            setIsEditingGoal(false);
            setGoalError('');
            setNewGoal(stats.vocabGoal);
          }}
        >
          <div 
            className="bg-white rounded-xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit Vocabulary Goal</h2>
            <input
              type="number"
              value={newGoal}
              onChange={(e) => {
                const value = e.target.value;
                setNewGoal(value === '' ? '' : parseInt(value));
                setGoalError('');
              }}
              className={`w-full p-2 border rounded-lg mb-1 focus:outline-none focus:ring-2 ${
                goalError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-red-800'
              }`}
              min="0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateVocabGoal();
                }
              }}
            />
            {goalError && (
              <p className="text-red-500 text-sm mb-3">{goalError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditingGoal(false);
                  setGoalError('');
                  setNewGoal(stats.vocabGoal);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateVocabGoal}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
