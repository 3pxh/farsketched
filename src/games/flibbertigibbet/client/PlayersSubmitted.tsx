import { Stack, Avatar } from '@mui/material';

interface PlayersSubmittedProps {
  count: number;
  avatarUrl: string;
}

export function PlayersSubmitted({ count, avatarUrl }: PlayersSubmittedProps) {
  return (
    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
      <Avatar src={avatarUrl} sx={{ bgcolor: 'grey.400', color: 'grey.900', fontWeight: 700 }} />
      {Array.from({ length: Math.max(0, count - 1) }).map((_, idx) => (
        <Avatar key={idx} sx={{ bgcolor: 'grey.400', color: 'grey.900', fontWeight: 700 }}>
          ?
        </Avatar>
      ))}
    </Stack>
  );
} 