const WHITE_NOTES = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72];
const BLACK_NOTES = [49, 51, 54, 56, 58, 61, 63, 66, 68, 70];
const KEY_HINTS: Record<number, string> = {
  48: "Z", 49: "S", 50: "X", 51: "D", 52: "C", 53: "V", 54: "G",
  55: "B", 56: "H", 57: "N", 58: "J", 59: "M", 60: ",", 61: "L",
  62: ".", 63: ";", 64: "/",
};

type PianoProps = {
  transpose: number;
  activeNotes: Set<number>;
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
};

export function Piano({ transpose, activeNotes, onNoteOn, onNoteOff }: PianoProps) {
  const pointerDown = (note: number) => (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onNoteOn(note + transpose);
  };
  const pointerUp = (note: number) => () => onNoteOff(note + transpose);

  return (
    <div className="piano" role="group" aria-label="Playable piano keyboard">
      <div className="white-keys">
        {WHITE_NOTES.map((note) => (
          <button
            type="button"
            key={note}
            className={activeNotes.has(note + transpose) ? "piano-key white active" : "piano-key white"}
            aria-label={`MIDI note ${note + transpose}`}
            onPointerDown={pointerDown(note)}
            onPointerUp={pointerUp(note)}
            onPointerCancel={pointerUp(note)}
          >
            <span>{KEY_HINTS[note]}</span>
          </button>
        ))}
      </div>
      {BLACK_NOTES.map((note) => {
        const precedingWhites = WHITE_NOTES.filter((white) => white < note).length;
        const left = `${(precedingWhites / WHITE_NOTES.length) * 100}%`;
        return (
          <button
            type="button"
            key={note}
            className={activeNotes.has(note + transpose) ? "piano-key black active" : "piano-key black"}
            style={{ left }}
            aria-label={`MIDI note ${note + transpose}`}
            onPointerDown={pointerDown(note)}
            onPointerUp={pointerUp(note)}
            onPointerCancel={pointerUp(note)}
          >
            <span>{KEY_HINTS[note]}</span>
          </button>
        );
      })}
    </div>
  );
}
