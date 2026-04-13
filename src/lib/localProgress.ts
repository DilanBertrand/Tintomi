/** Browser keys for progress that survives refresh (scoped per user id). */

export const localProgressKeys = {
  communityPoll: (userId: string) => `tintomi:v1:community:poll:${userId}`,
  communityChallengeJoined: (userId: string) => `tintomi:v1:community:challenge:${userId}`,
  learnXp: (userId: string) => `tintomi:v1:learn:xp:${userId}`,
  learnCompletedLessons: (userId: string) => `tintomi:v1:learn:completedLessons:${userId}`,
} as const
