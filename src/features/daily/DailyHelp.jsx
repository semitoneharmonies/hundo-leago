import { useRef } from 'react';
import './DailyHelp.css';

export function DailyHelp() {
  const dialog = useRef(null);
  return <>
    <button type="button" className="hd-action" aria-haspopup="dialog"
      onClick={() => dialog.current.showModal()}>What is Hundo Daily?</button>
    <dialog ref={dialog} className="hd-help" aria-labelledby="hd-help-title">
      <div className="hd-help-heading">
        <h2 id="hd-help-title">What is Hundo Daily?</h2>
        <button type="button" className="hd-action" autoFocus onClick={() => dialog.current.close()}>Close</button>
      </div>
      <p className="hd-help-lead">Build a team. Watch the games. Win the night.</p>
      <p>Hundo Daily is free, one-day fantasy hockey. Join a room or open one with friends, then build your team in a live auction using players from that day’s NHL games.</p>
      <p>You have a $100 budget and seven roster spots. Decide who’s worth spending on, find a bargain, and put your lineup to the test. Once the auction closes, rosters lock. When the commissioner enables the cap savings bonus, every $1 left unspent boosts your team’s positive fantasy points by 0.25%. The highest total after the games wins.</p>
      <p>Play in one room or several, or watch a room without joining. The lobby groups rooms by their NHL game day. Each day is a fresh start.</p>
      <details className="hd-help-details">
        <summary>How the auction works</summary>
        <section>
          <h3>Make your picks</h3>
          <p>Your seven spots are <strong>3 forwards, 2 defencemen and 2 flex</strong>. Either position can fill a flex spot. The player pool shows who’s playing and their opponent.</p>
          <h3>Name your price</h3>
          <p>Hit Bid to put a player on the auction floor or join an auction already running. Bids are sealed: you can see how many bids there are, but only your own amount. You get one binding bid per player, so make it count. The highest bid wins when that player’s timer runs out.</p>
          <h3>Spend smart</h3>
          <p>A signing comes out of your budget. You can bid on several players at once; Daily reserves enough money and roster space in case you win them all. That keeps every bid within your budget and position limits.</p>
          <p>With the cap savings bonus enabled, a bargain can pay twice: once on the ice, then through your cap bonus. Spend $60 and save $40 for a 10% boost. If your players earn 30 FP, your total becomes 33 FP. Every dollar counts; there are no spending brackets.</p>
          <h3>Watch the clock</h3>
          <p>The room creator picks the start time. Auctions last up to 30 minutes and finish by the first puck drop; they can end early when everyone’s roster is full. Room members get a reminder 10 minutes before the start. Once the auction closes, your lineup is locked. Any empty spots earn zero.</p>
          <h3>Follow the race</h3>
          <p>Your players earn fantasy points from goals, assists, shots, hits, blocks and other contributions. Check the standings and expand a manager’s name to see their roster and individual stats. Scores update as game stats arrive, with the winner confirmed after the day’s stats are collected.</p>
          <p>The cap bonus is added to your team total, not individual player stats. Zero or negative team FP earns no bonus. Existing rooms keep the scoring rules they were created with.</p>
          <h3>Watch and chat</h3>
          <p>You can watch a room’s auction and standings without taking a seat. The commissioner chooses at creation whether signed-in spectators can join the chat. Otherwise, chat is for room members only. Once standings are final, chat history remains available to its permitted viewers, but posting closes.</p>
        </section>
      </details>
    </dialog>
  </>;
}
