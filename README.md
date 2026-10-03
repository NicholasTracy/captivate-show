# Captivate Show

Cross-platform holiday show sequencer - DMX, Art-Net, sACN, WLED, synced media.

## Dev

```bash
npm install
npm run dev
```

## Layout

- `electron/eng/` - clk, seq, dmx, med, strm
- `shared/` - show schema, ipc, tc, clipEval
- `src/ui/` - proj, media, seq, stat, prev, out, fix, sch

## Phases

1. Scaffold + timeline + transport + DMX eval
2. Media import, ffmpeg waveform, audio playback
3. Preview + output windows
4. NDI/RTSP from main process
5. Fixture stage + scheduler (port Captivate 2)