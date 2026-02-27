"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [showNewGoal, setShowNewGoal] = useState(false);
    const [newGoal, setNewGoal] = useState({
        goal_type: 'monthly',
        target_value: 5
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadGoalsAndAchievements();
    }, []);

    const loadGoalsAndAchievements = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load goals
            const { data: goalsData } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            // Load achievements
            const { data: achievementsData } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', user.id)
                .order('earned_at', { ascending: false });

            setGoals(goalsData || []);
            setAchievements(achievementsData || []);
        } catch (error) {
            console.error('Error loading goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const createGoal = async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Calculate end date based on goal type
            const endDate = new Date();
            if (newGoal.goal_type === 'weekly') {
                endDate.setDate(endDate.getDate() + 7);
            } else if (newGoal.goal_type === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            } else if (newGoal.goal_type === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            const { error } = await supabase
                .from('goals')
                .insert({
                    user_id: user.id,
                    goal_type: newGoal.goal_type,
                    target_value: newGoal.target_value,
                    end_date: endDate.toISOString().split('T')[0],
                    current_value: 0,
                    status: 'active'
                });

            if (error) throw error;

            setShowNewGoal(false);
            loadGoalsAndAchievements();
        } catch (error) {
            console.error('Error creating goal:', error);
        }
    };

    // Achievement definitions
    const availableAchievements = [
        { type: 'first_book', name: 'First Book', description: 'Finished your first book', icon: '📖' },
        { type: 'five_books', name: 'Book Lover', description: 'Finished 5 books', icon: '📚' },
        { type: 'ten_books', name: 'Bookworm', description: 'Finished 10 books', icon: '🐛' },
        { type: 'twenty_five_books', name: 'Scholar', description: 'Finished 25 books', icon: '🎓' },
        { type: 'fifty_books', name: 'Master Reader', description: 'Finished 50 books', icon: '👑' },
        { type: 'seven_day_streak', name: 'Consistent Reader', description: 'Read 7 days in a row', icon: '🔥' },
        { type: 'thirty_day_streak', name: 'Reading Champion', description: 'Read 30 days in a row', icon: '🏆' },
        { type: 'hundred_pages', name: 'Speed Reader', description: 'Read 100 pages in a day', icon: '⚡' },
    ];

    return (
        <div className="space-y-8">
            {/* Goals Section */}
            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-blue-900">🎯 Reading Goals</h3>
                    <button
                        onClick={() => setShowNewGoal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        + New Goal
                    </button>
                </div>

                {goals.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        No active goals. Set a reading goal to track your progress!
                    </p>
                ) : (
                    <div className="space-y-4">
                        {goals.map(goal => {
                            const progress = (goal.current_value / goal.target_value) * 100;
                            const daysLeft = Math.ceil(
                                (new Date(goal.end_date) - new Date()) / (1000 * 60 * 60 * 24)
                            );

                            return (
                                <div key={goal.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-semibold text-blue-900 capitalize">
                                                {goal.goal_type} Goal
                                            </span>
                                            <p className="text-sm text-gray-600">
                                                Read {goal.target_value} books by {new Date(goal.end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {daysLeft} days left
                                        </span>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-blue-900 h-2.5 rounded-full transition-all"
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-between mt-2 text-sm">
                                        <span>{goal.current_value} books read</span>
                                        <span className="font-semibold">{goal.current_value}/{goal.target_value}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Achievements Section */}
            <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-6">🏆 Achievements</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {availableAchievements.map((achievement, index) => {
                        const earned = achievements.some(a => a.achievement_type === achievement.type);
                        
                        return (
                            <div 
                                key={index}
                                className={`p-4 rounded-lg text-center transition ${
                                    earned 
                                        ? 'bg-amber-50 border-2 border-amber-500' 
                                        : 'bg-gray-50 opacity-50'
                                }`}
                            >
                                <div className="text-3xl mb-2">{achievement.icon}</div>
                                <div className="font-semibold text-sm">{achievement.name}</div>
                                <div className="text-xs text-gray-600 mt-1">{achievement.description}</div>
                                {earned && (
                                    <span className="text-green-600 text-xs mt-2 block">✓ Earned</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* New Goal Modal */}
            {showNewGoal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-blue-900 mb-4">Create New Goal</h3>
                        
                        <form onSubmit={createGoal} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Goal Type</label>
                                <select
                                    value={newGoal.goal_type}
                                    onChange={(e) => setNewGoal({...newGoal, goal_type: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-2">Number of Books</label>
                                <input
                                    type="number"
                                    value={newGoal.target_value}
                                    onChange={(e) => setNewGoal({...newGoal, target_value: parseInt(e.target.value)})}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                    min="1"
                                    max="100"
                                    required
                                />
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800"
                                >
                                    Create Goal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNewGoal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}