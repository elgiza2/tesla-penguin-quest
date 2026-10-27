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
- Box outcomes are chosen only in the database (tsla_award_opening) after a verified Stars payment or balance debit; the client spin just animates to the server result. Why: prevents forged wins.
- Every box must keep at least HOUSE_MIN_MARGIN expected margin (src/lib/cases.ts, tested). Why: the house stays profitable on average.
- Regular gifts are delivered with Bot API sendGift from the bot's Star balance; NFT gifts go to an admin queue. Why: Bot API cannot transfer unique gifts without a business account.
