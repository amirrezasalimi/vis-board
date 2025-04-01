interface Props {
  mode: "canvas" | "cards" | "books";
  setMode: (mode: "canvas" | "cards" | "books") => void;
}
const ModeSwitch = ({ mode, setMode }: Props) => {
  return (
    <div className="top-4 left-1/2 z-20 absolute flex justify-center items-center gap-2 bg-[#FFE9CF] px-4 py-1 rounded-md -translate-x-1/2 cursor-pointer">
      <span
        className={`${mode == "canvas" && "font-semibold"}`}
        onClick={() => setMode("canvas")}
      >
        Canvas
      </span>
      <span
        className={`${mode == "cards" && "font-semibold"}`}
        onClick={() => setMode("cards")}
      >
        Cards
      </span>
      <span
        className={`${mode == "books" && "font-semibold"}`}
        onClick={() => setMode("books")}
      >
        Books
      </span>
    </div>
  );
};

export default ModeSwitch;
