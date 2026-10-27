<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Tesla gift-box rules
- Presentation fixtures live in a browser-safe demo module and only replace data outside Telegram; real balances and financial actions never use fixtures, to keep previews separate from money.
- Currency images use official Gram media and Telegram client assets through CDN pointers; shared balance controls live outside route files to avoid route-to-route dependencies.
- The gift catalogue separates live Telegram sale prices from dated Getgems NFT listing snapshots; snapshots are partial asking-price evidence, never acquisition costs or collection floors.
- Box outcomes are chosen only in the database (tsla_award_opening) after a verified Stars payment or balance debit; the client spin just animates to the server result. Why: prevents forged wins.
- Every box must keep at least HOUSE_MIN_MARGIN expected margin (src/lib/cases.ts, tested). Why: the house stays profitable on average.
- Regular gifts are delivered with Bot API sendGift from the bot's Star balance; NFT gifts go to an admin queue. Why: Bot API cannot transfer unique gifts without a business account.
