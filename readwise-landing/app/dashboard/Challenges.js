"use client";
import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";

export default function Challenges() {
    const [challenges, setChallenges] = useState([]);
    const [myChallenges, setMyChallenges] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newChallenge, setNewChallenge] = useState({
        title: '',
        description: '',
        challenge_type: 'books',
        target_value: 10,
        end_date: ''
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadChallenges();
    }, []);

    const loadChallenges = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Get public challenges
            const { data: publicChallenges } = await supabase
                .from('challenges')
                .select('*')
                .eq('is_public', true)
                .gte('end_date', new Date().toISOString().split('T')[0])
                .order('end_date', { ascending: true });

            // Get challenges user has joined
            const { data: userChallenges } = await supabase
                .from('user_challenges')
                .select(`
                    *,
                    challenge:challenges(*)
                `)
                .eq('user_id', user.id);

            setChallenges(publicChallenges || []);
            setMyChallenges(userChallenges || []);
        } catch (error) {
            console.error('Error loading challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const joinChallenge = async (challengeId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error } = await supabase
                .from('user_challenges')
                .insert({
                    user_id: user.id,
                    challenge_id: challengeId,
                    current_value: 0,
                    completed: false
                });

            if (error) throw error;
            
            loadChallenges();
        } catch (error) {
            console.error('Error joining challenge:', error);
        }
    };

    const createChallenge = async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const startDate = new Date();
            const endDate = new Date(newChallenge.end_date);

            const { error } = await supabase
                .from('challenges')
                .insert({
                    title: newChallenge.title,
                    description: newChallenge.description,
                    challenge_type: newChallenge.challenge_type,
                    target_value: newChallenge.target_value,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    created_by: user.id,
                    is_public: true
                });

            if (error) throw error;

            setShowCreateModal(false);
            loadChallenges();
        } catch (error) {
            console.error('Error creating challenge:', error);
        }
    };

    const shareProgress = async (type, referenceId, data) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            await supabase
                .from('shares')
                .insert({
                    user_id: user.id,
                    share_type: type,
                    reference_id: referenceId,
                    share_data: data
                });

            // Open share dialog
            if (navigator.share) {
                navigator.share({
                    title: 'Reading Achievement on ReadWise!',
                    text: `I just ${data.action} on ReadWise!`,
                    url: window.location.origin
                });
            } else {
                // Fallback - copy to clipboard
                navigator.clipboard.writeText(
                    `I just ${data.action} on ReadWise! Check it out at ${window.location.origin}`
                );
                alert('Share link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading challenges...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-blue-900">🏆 Reading Challenges</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                    + Create Challenge
                </button>
            </div>

            {/* My Active Challenges */}
            {myChallenges.length > 0 && (
                <div className="bg-white rounded-xl shadow p-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4">My Challenges</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        {myChallenges.map((uc) => {
                            const challenge = uc.challenge;
                            const progress = (uc.current_value / challenge.target_value) * 100;
                            const daysLeft = Math.ceil(
                                (new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24)
                            );

                            return (
                                <div key={uc.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-semibold text-blue-900">{challenge.title}</h5>
                                            <p className="text-sm text-gray-600">{challenge.description}</p>
                                        </div>
                                        <button
                                            onClick={() => shareProgress('challenge', challenge.id, {
                                                action: `made progress in ${challenge.title} challenge`
                                            })}
                                            className="text-blue-900 hover:text-blue-700"
                                        >
                                            📤 Share
                                        </button>
                                    </div>

                                    <div className="mt-3">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Progress</span>
                                            <span>{uc.current_value}/{challenge.target_value} {challenge.challenge_type}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-green-600 h-2 rounded-full"
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-3 text-sm text-gray-500">
                                        <span>{daysLeft} days left</span>
                                        {uc.completed && <span className="text-green-600">✓ Completed</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Available Challenges */}
            <div className="bg-white rounded-xl shadow p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Join a Challenge</h4>
                <div className="grid md:grid-cols-3 gap-4">
                    {challenges.map((challenge) => {
                        const alreadyJoined = myChallenges.some(uc => uc.challenge_id === challenge.id);
                        const daysLeft = Math.ceil(
                            (new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                            <div key={challenge.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                                <h5 className="font-semibold text-blue-900">{challenge.title}</h5>
                                <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                                
                                <div className="mt-3 text-sm">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        {challenge.target_value} {challenge.challenge_type}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-xs text-gray-500">{daysLeft} days left</span>
                                    {alreadyJoined ? (
                                        <span className="text-green-600 text-sm">✓ Joined</span>
                                    ) : (
                                        <button
                                            onClick={() => joinChallenge(challenge.id)}
                                            className="bg-blue-900 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-800"
                                        >
                                            Join Challenge
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Challenge Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-blue-900 mb-4">Create New Challenge</h3>
                        
                        <form onSubmit={createChallenge} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Challenge Title</label>
                                <input
                                    type="text"
                                    value={newChallenge.title}
                                    onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={newChallenge.description}
                                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                    rows="3"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-2">Challenge Type</label>
                                    <select
                                        value={newChallenge.challenge_type}
                                        onChange={(e) => setNewChallenge({...newChallenge, challenge_type: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                    >
                                        <option value="books">Books</option>
                                        <option value="pages">Pages</option>
                                        <option value="days">Days</option>
                                        <option value="streak">Streak</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Target</label>
                                    <input
                                        type="number"
                                        value={newChallenge.target_value}
                                        onChange={(e) => setNewChallenge({...newChallenge, target_value: parseInt(e.target.value)})}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={newChallenge.end_date}
                                    onChange={(e) => setNewChallenge({...newChallenge, end_date: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800"
                                >
                                    Create Challenge
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
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