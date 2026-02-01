import type { ReactionType } from '../stores/profile-comments.store'

export function useReactions() {
  const emojiMap: Record<ReactionType, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    wow: '😮',
    fire: '🔥',
    idea: '💡',
    party: '🎉',
    clap: '👏',
    poop: '💩',
    clown: '🤡',
    sleepy: '😴',
    vomit: '🤮',
  }

  const labelMap: Record<ReactionType, string> = {
    like: 'Gefällt mir',
    love: 'Love',
    laugh: 'Lustig',
    wow: 'Wow',
    fire: 'Fire',
    idea: 'Gute Idee',
    party: 'Feier es',
    clap: 'Applaus',
    poop: 'Bullshit',
    clown: 'Clown',
    sleepy: 'Langweilig',
    vomit: 'Cringe',
  }

  function getReactionEmoji(type: ReactionType): string {
    return emojiMap[type] || '👍'
  }

  function getReactionLabel(type: ReactionType): string {
    return labelMap[type] || 'Reaktion'
  }

  return {
    getReactionEmoji,
    getReactionLabel,
  }
}
