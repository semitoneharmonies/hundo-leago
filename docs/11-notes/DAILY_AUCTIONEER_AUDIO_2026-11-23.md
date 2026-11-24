# Daily auctioneer and independent sound effects — local candidate

Graem approved a looping background auctioneer during live Daily auctions and separate Auctioneer and Sound FX buttons. Hold this change for the room-chat release; do not push or deploy it separately. The candidate starts from the chat frontend at `120bcdc73b65ff1d30000a39e81d79860f4870ff`.

## Behavior

- One shared quiet loop while at least one displayed, joined room is in the server's auction phase and before its deadline. Several simultaneous rooms never layer recordings.
- Audio unlocks after an interaction. Loading/decoding failures do not interrupt navigation or bidding; another interaction can retry.
- Auctioneer and sound-effect preferences are saved separately for each account on this device. The existing sound-effect key is preserved. On first migration, an existing all-sounds mute also defaults the new auctioneer preference off; thereafter both are independent.
- The loop stops on mute, the final live room ending early or expiring, room removal or lost access, navigation away from the desk, tab hiding, sign-out, and provider teardown. It resumes only while eligible. Read-only observations never write room or league data.
- The loop uses a separate low-volume Web Audio gain, so changing sound effects does not mute the recording and changing the recording does not mute sound effects.

## Recording provenance

- Graem identified his downloaded recording as **Auction Caller**, by **5deMayo**: https://freesound.org/people/5deMayo/sounds/497042/.
- Source listing: **CC0 1.0**, https://creativecommons.org/publicdomain/zero/1.0/. Attribution is not required; this record retains provenance.
- Graem trimmed it in VideoPad to `E:/Hundo Leago/Sequence 1.wav`. The local conversion is a 128 kbps, stereo, 44.1 kHz MP3, approximately 106 seconds and 1,699,004 bytes.
- Bundled asset: `public/audio/daily-auctioneer-v1.mp3`; SHA-256 `6ee7d629c7121d462e7e475bdd76ddd262b5471660d7c4fa4c60d4ca7c4a5496`.

The endpoint's musical/linguistic seam and subjective background volume still need user listening acceptance. Automated verification is recorded separately in the local handoff. No physical-device or hosted acceptance is implied.
