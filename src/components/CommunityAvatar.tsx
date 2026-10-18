type Props = { name: string; imageUrl: string; small?: boolean };

export default function CommunityAvatar({ name, imageUrl, small = false }: Props) {
  const label = name.trim().slice(0, 1).toUpperCase() || '?';
  return imageUrl ? (
    <img className={small ? 'community-avatar community-avatar--small' : 'community-avatar'} src={imageUrl} alt={`${name}'s profile`} />
  ) : (
    <span className={small ? 'community-avatar community-avatar--small community-avatar--empty' : 'community-avatar community-avatar--empty'} aria-label={`${name}'s profile picture`}>
      {label}
    </span>
  );
}
