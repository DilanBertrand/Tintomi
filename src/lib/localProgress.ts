/** Browser keys for progress that survives refresh (scoped per user id). */

export const localProgressKeys = {
  communityPoll: (userId: string) => `tintomi:v1:community:poll:${userId}`,
  communityChallengeJoined: (userId: string) => `tintomi:v1:community:challenge:${userId}`,
  learnXp: (userId: string) => `tintomi:v1:learn:xp:${userId}`,
  learnCompletedLessons: (userId: string) => `tintomi:v1:learn:completedLessons:${userId}`,
  learnCompletedStories: (userId: string) => `tintomi:v1:learn:completedStories:${userId}`,
  learnWeakSpots: (userId: string) => `tintomi:v1:learn:weakSpots:${userId}`,
  learnStreak: (userId: string) => `tintomi:v1:learn:streak:${userId}`,
  investWallet: (userId: string) => `tintomi:v1:invest:wallet:${userId}`,
} as const
