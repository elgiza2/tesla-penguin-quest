export async function shareReferral(imageUrl: string, link: string, lang: string) {
 const text = `Join me on Tesla in Telegram. Collect TSLA through mining and tasks.\n${link}`;
 const response = await fetch(imageUrl);
 if (!response.ok) throw new Error("Referral image unavailable");
 const file = new File([await response.blob()], "tesla-invitation.jpg", { type: "image/jpeg" });
 if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Tesla", text }); return; }
 const url = URL.createObjectURL(file), anchor = document.createElement("a"); anchor.href = url; anchor.download = file.name; anchor.click(); URL.revokeObjectURL(url);
 if (navigator.share) await navigator.share({ title: "Tesla", text });
 else window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text.replace(link, ""))}`, "_blank", "noopener");
}
