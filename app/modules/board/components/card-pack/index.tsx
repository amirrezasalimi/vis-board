import type { CardPack as CardPackType } from "../../types/card";
import { colord } from "colord";

interface Props extends CardPackType {
  className?: string;
}
const CardPack = ({
  title,
  description,
  cards,
  className,
  gradient_color,
}: Props) => {
  const color = colord(gradient_color ?? "#494B74");
  const lighterColor = color.lighten(0.25);

  return (
    <div
      className={`relative flex flex-col justify-between px-2 pt-10 pb-4 rounded-xl outline-none aspect-[1/1.26] overflow-hidden text-white text-center hover:scale-[1.03] transition-transform cursor-pointer ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle, ${lighterColor.toRgbString()} 0%, ${color.toRgbString()} 100%)`,
      }}
    >
      <h3 className="text-lg tracking-wider">{title}</h3>
      <span className="-bottom-12 left-1/2 absolute bg-[rgba(0,0,0,0.15)] blur-lg rounded-full size-24 -translate-x-1/2" />
      <span className="z-10 font-semibold text-xl">{cards.length} Cards</span>
    </div>
  );
};

export default CardPack;
