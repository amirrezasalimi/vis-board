import { Handle, type HandleProps } from "@xyflow/react";

interface Props extends HandleProps {
  color?: string;
}
const NiceHandle = (props: Props) => {
  return (
    <Handle
      {...props}
      className={`${props.className} !size-2 !border-none !bg-[#D8BFD8]`}
    />
  );
};

export default NiceHandle;
