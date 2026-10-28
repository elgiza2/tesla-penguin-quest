import { openLink } from "@/lib/telegram";

export const inviteLink = (userId: number | string) => `https://t.me/Noveaibot?start=ref_${userId}`;

/** Opens Telegram's share sheet with the user's personal invite link. */
export function shareInvite(userId: number | string) {
  const link = inviteLink(userId);
  openLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Open gift boxes and win Telegram gifts with me on Tesla 🎁")}`);
}
