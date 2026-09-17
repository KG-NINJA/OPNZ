import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  Edit3,
  Menu,
  Music2,
  Minus,
  Play,
  Plus,
  Save,
  Search,
  Settings,
  Square,
  Trash2,
} from "lucide-react";
import { AlgorithmSelector } from "./components/AlgorithmSelector";
import { Knob } from "./components/Knob";
import { OperatorPanel } from "./components/OperatorPanel";
import { Piano } from "./components/Piano";
import { Scope } from "./components/Scope";
import { Opn2Engine } from "./audio/engine";
import { cloneVoice, FACTORY_PRESETS } from "./audio/presets";
import { voiceToRegisterWrites } from "./audio/registers";
import type { EngineStatus, Operator, Voice } from "./audio/types";

const CHANNEL_COLORS = ["#37caff", "#ffbd43", "#ec49b6", "#8ce94b", "#9eacb5", "#a9b7bf"];
const KEYBOARD_KEYS = ["z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", ",", "l", ".", ";", "/"];
const USER_PRESET_KEY = "opnz-user-presets-v1";

type RightTab = "LFO" | "DAC" | "Scope" | "Registers";

function loadUserPresets(): Voice[] {
  try {
    const value = localStorage.getItem(USER_PRESET_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (voice): voice is Voice =>
        typeof voice === "object" &&
        voice !== null &&
        "schemaVersion" in voice &&
        voice.schemaVersion === 1 &&
        "operators" in voice &&
        Array.isArray(voice.operators) &&
        voice.operators.length === 4,
    );
  } catch {
    return [];
  }
}

function App() {
  const [voices, setVoices] = useState<Voice[]>(() =>
    Array.from({ length: 6 }, (_, index) => cloneVoice(FACTORY_PRESETS[index])),
  );
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [userPresets, setUserPresets] = useState<Voice[]>(loadUserPresets);
  const [presetQuery, setPresetQuery] = useState("");
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [midiConnected, setMidiConnected] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [octave, setOctave] = useState(4);
  const [velocity, setVelocity] = useState(100);
  const [lfoOn, setLfoOn] = useState(false);
  const [lfoRate, setLfoRate] = useState(3);
  const [dacOn, setDacOn] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("LFO");
  const engineRef = useRef<Opn2Engine | null>(null);
  const pressedKeys = useRef(new Map<string, number>());
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  if (!engineRef.current) {
    engineRef.current = new Opn2Engine((nextStatus, message) => {
      setStatus(nextStatus);
      setStatusMessage(message ?? "");
    });
  }

  const selectedVoice = voices[selectedChannel];
  const allPresets = useMemo(
    () => [...FACTORY_PRESETS, ...userPresets],
    [userPresets],
  );
  const filteredPresets = allPresets.filter((preset) =>
    preset.name.toLowerCase().includes(presetQuery.toLowerCase()),
  );

  const replaceSelectedVoice = useCallback(
    (voice: Voice) => {
      const copy = cloneVoice(voice);
      setVoices((current) =>
        current.map((item, index) => (index === selectedChannel ? copy : item)),
      );
      engineRef.current?.setVoice(selectedChannel, copy);
    },
    [selectedChannel],
  );

  const updateSelectedVoice = useCallback(
    <K extends keyof Voice>(key: K, value: Voice[K]) => {
      const next = { ...selectedVoice, [key]: value } as Voice;
      replaceSelectedVoice(next);
    },
    [replaceSelectedVoice, selectedVoice],
  );

  const updateOperator = (operatorIndex: number, operator: Operator) => {
    const next = cloneVoice(selectedVoice);
    next.operators[operatorIndex] = operator;
    replaceSelectedVoice(next);
  };

  const start = async () => {
    try {
      await engineRef.current?.start(voices);
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const stop = async () => {
    setActiveNotes(new Set());
    pressedKeys.current.clear();
    await engineRef.current?.suspend();
    setPlaying(false);
  };

  const noteOn = useCallback(
    (note: number, noteVelocity = velocity) => {
      if (!playing) return;
      setActiveNotes((current) => new Set(current).add(note));
      engineRef.current?.noteOn(note, noteVelocity);
    },
    [playing, velocity],
  );

  const noteOff = useCallback((note: number) => {
    setActiveNotes((current) => {
      const next = new Set(current);
      next.delete(note);
      return next;
    });
    engineRef.current?.noteOff(note);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, select, textarea, button")) return;
      const index = KEYBOARD_KEYS.indexOf(event.key.toLowerCase());
      if (index < 0 || pressedKeys.current.has(event.key)) return;
      event.preventDefault();
      const note = 12 * (octave + 1) + index;
      pressedKeys.current.set(event.key, note);
      noteOn(note);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const note = pressedKeys.current.get(event.key);
      if (note === undefined) return;
      event.preventDefault();
      pressedKeys.current.delete(event.key);
      noteOff(note);
    };
    const releaseAll = () => {
      pressedKeys.current.forEach((note) => noteOff(note));
      pressedKeys.current.clear();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseAll);
    };
  }, [noteOff, noteOn, octave]);

  const connectMidi = async () => {
    if (!("requestMIDIAccess" in navigator)) {
      setStatusMessage("Web MIDI is not available in this browser.");
      return;
    }
    try {
      const access = await navigator.requestMIDIAccess();
      midiAccessRef.current = access;
      const bindInputs = () => {
        access.inputs.forEach((input) => {
          input.onmidimessage = (event) => {
            if (!event.data) return;
            const [command = 0, note = 0, value = 0] = event.data;
            const type = command & 0xf0;
            if (type === 0x90 && value > 0) noteOn(note, value);
            else if (type === 0x80 || (type === 0x90 && value === 0)) noteOff(note);
          };
        });
        setMidiConnected(access.inputs.size > 0);
      };
      access.onstatechange = bindInputs;
      bindInputs();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "MIDI permission was denied.");
    }
  };

  const toggleRecording = async () => {
    if (!recording) {
      if (engineRef.current?.startRecording()) setRecording(true);
      else setStatusMessage("Recording is not supported by this browser.");
      return;
    }
    const blob = await engineRef.current?.stopRecording();
    setRecording(false);
    if (!blob) return;
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `opnz-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1_000);
  };

  const persistUserPresets = (presets: Voice[]) => {
    setUserPresets(presets);
    localStorage.setItem(USER_PRESET_KEY, JSON.stringify(presets));
  };

  const savePreset = () => {
    const name = window.prompt("Preset name", selectedVoice.name) ?? "";
    if (!name.trim()) return;
    const saved = { ...cloneVoice(selectedVoice), name: name.trim() };
    persistUserPresets([...userPresets, saved]);
    replaceSelectedVoice(saved);
  };

  const renamePreset = () => {
    const match = userPresets.find((preset) => preset.name === selectedVoice.name);
    if (!match) return setStatusMessage("Factory presets cannot be renamed. Save a copy first.");
    const name = window.prompt("New preset name", selectedVoice.name) ?? "";
    if (!name.trim()) return;
    const renamed = { ...cloneVoice(selectedVoice), name: name.trim() };
    persistUserPresets(
      userPresets.map((preset) => (preset === match ? renamed : preset)),
    );
    replaceSelectedVoice(renamed);
  };

  const deletePreset = () => {
    const next = userPresets.filter((preset) => preset.name !== selectedVoice.name);
    if (next.length === userPresets.length) {
      setStatusMessage("Factory presets cannot be deleted.");
      return;
    }
    persistUserPresets(next);
    replaceSelectedVoice(FACTORY_PRESETS[0]);
  };

  const setLfo = (enabled: boolean, rate = lfoRate) => {
    setLfoOn(enabled);
    setLfoRate(rate);
    engineRef.current?.setLfo(enabled, rate);
  };

  const setDac = (enabled: boolean) => {
    setDacOn(enabled);
    engineRef.current?.setDacEnabled(enabled);
  };

  const registerWrites = voiceToRegisterWrites(selectedChannel, selectedVoice);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>OPN2 <span>PLAYGROUND</span></strong>
          <small>FM SYNTHESIZER<br />YM2612 / YM3438</small>
        </div>
        <div className="transport" aria-label="Transport controls">
          <button className="transport-button play" type="button" onClick={start} disabled={status === "loading" || playing}>
            <Play fill="currentColor" size={16} /> Play
          </button>
          <button className="transport-button" type="button" onClick={stop} disabled={!playing}>
            <Square fill="currentColor" size={13} /> Stop
          </button>
          <button className={recording ? "transport-button recording" : "transport-button"} type="button" onClick={toggleRecording} disabled={!playing}>
            <Circle fill="currentColor" size={15} /> {recording ? "Recording" : "Record"}
          </button>
          <button className="midi-button" type="button" onClick={connectMidi}>
            <span className={midiConnected ? "status-dot ready" : "status-dot"} />
            <Music2 size={17} /> MIDI
            <small>{midiConnected ? "Connected" : "Connect"}</small>
          </button>
        </div>
        <div className="top-actions" aria-hidden="true">
          <Settings size={19} />
          <Menu size={21} />
        </div>
      </header>

      <div className="workspace">
        <aside className="channel-rail">
          <h2>CHANNELS</h2>
          <div className="channel-list">
            {voices.map((voice, index) => (
              <button
                type="button"
                key={index}
                className={selectedChannel === index ? "channel active" : "channel"}
                onClick={() => setSelectedChannel(index)}
              >
                <span className="channel-dot" style={{ background: CHANNEL_COLORS[index] }} />
                <span>CH {index + 1}</span>
                <small>{voice.name}</small>
                <span className="chevron">›</span>
              </button>
            ))}
          </div>

          <h2 className="preset-heading">PRESET</h2>
          <div className="preset-current">{selectedVoice.name}<span>⌄</span></div>
          <label className="preset-search">
            <Search size={15} />
            <input
              value={presetQuery}
              onChange={(event) => setPresetQuery(event.target.value)}
              placeholder="Search presets..."
              aria-label="Search presets"
            />
          </label>
          <div className="preset-list">
            <small>FACTORY + USER</small>
            {filteredPresets.map((preset, index) => (
              <button
                type="button"
                key={`${preset.name}-${index}`}
                className={selectedVoice.name === preset.name ? "active" : ""}
                onClick={() => replaceSelectedVoice(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="preset-actions">
            <button type="button" onClick={savePreset} aria-label="Save preset"><Save size={14} /> Save</button>
            <button type="button" onClick={renamePreset} aria-label="Rename preset"><Edit3 size={14} /></button>
            <button type="button" onClick={deletePreset} aria-label="Delete preset"><Trash2 size={14} /></button>
          </div>
        </aside>

        <section className="editor">
          <header className="editor-titlebar">
            <h1>CH {selectedChannel + 1} <span /> 4-OPERATOR FM VOICE EDITOR</h1>
            <div>Note: <strong>{activeNotes.size ? [...activeNotes].at(-1) : "—"}</strong></div>
          </header>
          <section className="algorithm-section">
            <div className="algorithm-area">
              <h2>Algorithm</h2>
              <AlgorithmSelector value={selectedVoice.algorithm} onChange={(value) => updateSelectedVoice("algorithm", value)} />
            </div>
            <Knob
              label="Feedback"
              value={selectedVoice.feedback}
              min={0}
              max={7}
              onChange={(value) => updateSelectedVoice("feedback", value)}
            />
            <div className="signal-chain" aria-label="Current operator route">
              {[4, 3, 2, 1].map((operator, index) => (
                <span key={operator} style={{ borderColor: CHANNEL_COLORS[3 - index], color: CHANNEL_COLORS[3 - index] }}>{operator}</span>
              ))}
              <small>OUT</small>
            </div>
          </section>
          <div className="operators-grid">
            {selectedVoice.operators.map((operator, index) => (
              <OperatorPanel
                key={index}
                index={index}
                operator={operator}
                color={CHANNEL_COLORS[index]}
                onChange={(next) => updateOperator(index, next)}
              />
            ))}
          </div>
        </section>

        <aside className="inspector">
          <nav className="inspector-tabs" aria-label="Inspector tabs">
            {(["LFO", "DAC", "Scope", "Registers"] as RightTab[]).map((tab) => (
              <button type="button" className={rightTab === tab ? "active" : ""} key={tab} onClick={() => setRightTab(tab)}>{tab}</button>
            ))}
          </nav>
          {rightTab !== "Registers" ? (
            <>
              <section className="inspector-section">
                <div className="section-heading"><h2>LFO</h2><label className="toggle"><input type="checkbox" checked={lfoOn} onChange={(event) => setLfo(event.target.checked)} /><span /> On</label></div>
                <div className="lfo-controls">
                  <Knob label="Frequency" value={lfoRate} min={0} max={7} displayValue={`Rate ${lfoRate}`} onChange={(value) => setLfo(lfoOn, value)} />
                  <Knob label="PM Depth" value={selectedVoice.pms} min={0} max={7} onChange={(value) => updateSelectedVoice("pms", value)} />
                  <Knob label="AM Depth" value={selectedVoice.ams} min={0} max={3} onChange={(value) => updateSelectedVoice("ams", value)} />
                </div>
              </section>
              <section className="inspector-section dac-section">
                <div className="section-heading"><h2>DAC</h2><label className="toggle"><input type="checkbox" checked={dacOn} onChange={(event) => setDac(event.target.checked)} /><span /> On</label></div>
                <p>{dacOn ? "CH 6 reserved for 8-bit DAC" : "FM channel 6 available"}</p>
              </section>
              <section className="inspector-section pan-section">
                <h2>Channel Pan (CH {selectedChannel + 1})</h2>
                <div className="pan-control">
                  {(["left", "center", "right"] as const).map((pan) => (
                    <button type="button" key={pan} className={selectedVoice.pan === pan ? "active" : ""} onClick={() => updateSelectedVoice("pan", pan)}>{pan[0].toUpperCase()}</button>
                  ))}
                </div>
              </section>
              <section className="scope-section">
                <div className="section-heading"><h2>Scope</h2><span>Main Out</span></div>
                <Scope analyser={engineRef.current?.analyser ?? null} active={playing} />
                <footer><span>1.00 ms/div</span><span>±1.0</span></footer>
              </section>
            </>
          ) : (
            <section className="register-panel">
              <h2>CH {selectedChannel + 1} REGISTER WRITES</h2>
              <p>Voice parameters compiled to OPN2 bus writes.</p>
              <ol>
                {registerWrites.map((write, index) => (
                  <li key={`${write.address}-${index}`}>
                    <span>P{write.port}</span>
                    <code>0x{write.address.toString(16).padStart(2, "0").toUpperCase()}</code>
                    <code>0x{write.value.toString(16).padStart(2, "0").toUpperCase()}</code>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>

      <section className="keyboard-dock">
        <div className="keyboard-controls">
          <span>Octave</span>
          <div><button type="button" aria-label="Octave down" onClick={() => setOctave((value) => Math.max(1, value - 1))}><Minus size={14} /></button><strong>{octave}</strong><button type="button" aria-label="Octave up" onClick={() => setOctave((value) => Math.min(7, value + 1))}><Plus size={14} /></button></div>
          <Knob label="Velocity" value={velocity} min={1} max={127} displayValue={`${velocity}`} onChange={setVelocity} />
        </div>
        <Piano transpose={(octave - 3) * 12} activeNotes={activeNotes} onNoteOn={noteOn} onNoteOff={noteOff} />
      </section>

      <footer className="statusbar">
        <span>Nuked-OPN2 <i /> YM3438 cycle-accurate core <i /> WebAssembly</span>
        <span className="runtime-status"><b className={`status-dot ${status === "ready" ? "ready" : status === "error" ? "error" : ""}`} />{status === "loading" ? "Loading core" : status === "error" ? "Engine error" : status === "ready" ? "Ready" : "Stopped"}<i />Sample Rate: {engineRef.current?.sampleRate ? `${(engineRef.current.sampleRate / 1000).toFixed(1)} kHz` : "—"}<i />Voices: {activeNotes.size}/6</span>
      </footer>
      {statusMessage && <button className="toast" type="button" onClick={() => setStatusMessage("")}>{statusMessage}</button>}
    </main>
  );
}

export default App;
